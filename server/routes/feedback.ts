import { Router, Request, Response } from 'express';
import { sendEmail } from '../services/emailService';

const router = Router();

// Feedback submission endpoint
router.post('/submit', async (req: Request, res: Response) => {
  try {
    console.log('📝 Feedback request received:', {
      bodyExists: !!req.body,
      bodyContent: req.body,
      headers: req.headers['content-type']
    });

    const { feedback, userEmail, userName } = req.body;
    
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Feedback content is required' 
      });
    }

    // Prepare email content
    const emailSubject = 'New Feedback from Fluenti User';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b1d, #e55a1a); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .feedback-box { background: white; padding: 15px; border-left: 4px solid #ff6b1d; margin: 15px 0; border-radius: 4px; }
          .user-info { background: #e8f4fd; padding: 10px; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎯 New Feedback from Fluenti</h2>
            <p>A user has submitted feedback for the application</p>
          </div>
          
          <div class="content">
            <div class="user-info">
              <h3>📧 User Information</h3>
              <p><strong>Email:</strong> ${userEmail || 'Not provided'}</p>
              <p><strong>Name:</strong> ${userName || 'Anonymous'}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="feedback-box">
              <h3>💬 Feedback Content</h3>
              <p>${feedback.replace(/\n/g, '<br>')}</p>
            </div>
            
            <div class="footer">
              <p>This feedback was submitted through the Fluenti application feedback system.</p>
              <p>Fluenti - Your AI-powered companion for emotional wellness and mental health support.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to the configured feedback email address
    const feedbackEmail = process.env.EMAIL_FROM || 'fluenitai@gmail.com';
    
    await sendEmail({
      to: feedbackEmail,
      subject: emailSubject,
      html: emailHtml,
      text: `New Feedback from Fluenti User\n\nUser: ${userName || 'Anonymous'} (${userEmail || 'No email provided'})\nSubmitted: ${new Date().toLocaleString()}\n\nFeedback:\n${feedback}`
    });

    console.log('✅ Feedback email sent successfully');
    
    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit feedback. Please try again later.' 
    });
  }
});

export default router;