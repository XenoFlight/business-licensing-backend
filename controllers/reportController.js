const Report = require('../models/Report');
const Business = require('../models/Business');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateReportPDF } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

// אתחול מודל ה-AI (אם קיים מפתח)
// Initialize AI Model
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
  : null;

// @desc    יצירת דו"ח ביקורת חדש + ניתוח AI
// @route   POST /api/reports
// @access  Private (Inspector)
exports.createReport = async (req, res) => {
  try {
    let { businessId, findings, status, businessData } = req.body;
    const inspectorId = req.user.id; // נלקח מהטוקן

    // אם לא סופק מזהה עסק, אך סופקו פרטי עסק חדש - ניצור אותו
    // If no businessId but businessData provided - create the business
    if (!businessId && businessData) {
      try {
        const newBusiness = await Business.create({
          ...businessData,
          status: 'application_submitted' // סטטוס התחלתי
        });
        businessId = newBusiness.id;
      } catch (bizError) {
        return res.status(400).json({ message: 'שגיאה ביצירת עסק חדש', error: bizError.message });
      }
    }

    // בדיקה שהעסק קיים
    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ message: 'עסק לא נמצא' });
    }

    // 1. שמירת הדו"ח הראשוני במסד הנתונים
    // Save initial report to DB
    const report = await Report.create({
      businessId,
      inspectorId,
      findings,
      status,
      visitDate: new Date()
    });

    // 2. בונוס: הפעלת Gemini AI לניתוח סיכונים
    // Bonus: Trigger Gemini AI for Risk Assessment
    if (findings && genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `
          Act as an Israeli municipal safety inspector. 
          Analyze the following inspection findings: "${findings}".
          Return a valid JSON object (no markdown formatting) with the following keys:
          - "riskLevel": One of ["Low", "Medium", "High"]
          - "summary": A brief summary in Hebrew.
          - "recommendations": An array of strings (recommendations in Hebrew).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // ניקוי הטקסט מסימני Markdown אם יש (למשל ```json ... ```)
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const aiAssessment = JSON.parse(jsonStr);

        // עדכון הדו"ח עם תוצאות ה-AI
        report.aiRiskAssessment = aiAssessment;
        await report.save();
        
      } catch (aiError) {
        console.error('⚠️ AI Analysis failed:', aiError.message);
        // לא מכשילים את יצירת הדו"ח אם ה-AI נכשל, רק מתעדים בלוג
      }
    }

    // 3. יצירת קובץ PDF (שמירה מקומית או בענן)
    // Generate PDF
    try {
      // טעינת הנתונים המלאים עבור ה-PDF (כולל קשרים)
      const fullReport = await Report.findByPk(report.id, {
        include: [
          { model: Business },
          { model: User, as: 'inspector' }
        ]
      });

      if (fullReport) {
        const pdfBuffer = await generateReportPDF({
          report: fullReport,
          business: fullReport.Business,
          inspector: fullReport.inspector
        });

        // הגדרת נתיב שמירה (בייצור יש לשמור ב-Google Cloud Storage)
        // Save locally (In production use Cloud Storage)
        const fileName = `report_${report.id}_${Date.now()}.pdf`;
        const reportsDir = path.join(__dirname, '../public/reports');
        
        // יצירת התיקייה אם לא קיימת
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filePath = path.join(reportsDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // עדכון נתיב הקובץ ברשומה
        report.pdfPath = `/reports/${fileName}`;
        await report.save();
      }
    } catch (pdfError) {
      console.error('⚠️ PDF Generation failed:', pdfError.message);
      // לא מכשילים את הבקשה כולה, רק מתעדים
    }

    res.status(201).json({
      message: 'הדו"ח נוצר בהצלחה',
      report
    });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'שגיאה ביצירת דו"ח', error: error.message });
  }
};

// @desc    קבלת דו"חות של עסק מסוים
// @route   GET /api/reports/business/:businessId
// @access  Private
exports.getReportsByBusiness = async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { businessId: req.params.businessId },
      include: [
        { model: User, as: 'inspector', attributes: ['fullName'] }
      ],
      order: [['visitDate', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};

// @desc    קבלת כל הדו"חות (לוח ביקורות)
// @route   GET /api/reports
// @access  Private (Inspector/Manager/Admin)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: Business, attributes: ['id', 'businessName', 'address'] },
        { model: User, as: 'inspector', attributes: ['fullName'] }
      ],
      order: [['visitDate', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ message: 'שגיאת שרת בקבלת כל הדו"חות', error: error.message });
  }
};

// @desc    קבלת דו"ח לפי מזהה
// @route   GET /api/reports/:id
// @access  Private
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        { model: Business, attributes: ['businessName', 'address'] },
        { model: User, as: 'inspector', attributes: ['fullName'] }
      ]
    });

    if (report) {
      res.json(report);
    } else {
      res.status(404).json({ message: 'דו"ח לא נמצא' });
    }
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};

// @desc    עדכון סטטוס דו"ח
// @route   PUT /api/reports/:id
// @access  Private (Manager/Inspector)
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'דו"ח לא נמצא' });

    await report.update(req.body);
    res.json({ message: 'הדו"ח עודכן בהצלחה', report });
  } catch (error) {
    res.status(500).json({ message: 'שגיאת שרת', error: error.message });
  }
};