import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Add timeout to prevent hanging connections
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    // Return a dummy transporter that logs instead of sending
    return {
      sendMail: async (message) => {
        console.log('Email sending skipped due to transporter error');
        console.log('Would have sent:', message);
        return { messageId: 'dummy-id' };
      }
    };
  }
};

// Send approval request email to admin/HOD
const sendApprovalRequestEmail = async ({
  approverEmail,
  approverName,
  approverRole,
  requestorName,
  requestorEmail,
  requestorRole,
  requestorDepartment,
}) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `Logixica ERP <${process.env.EMAIL_FROM}>`,
      to: approverEmail,
      subject: 'New User Registration Approval Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a5568;">Logixica ERP System</h2>
            <p style="color: #718096;">User Registration Approval Request</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Hello ${approverName},</p>
            <p>As a ${approverRole}, you have received a new user registration approval request:</p>
          </div>
          
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #4a5568;">User Details:</h3>
            <p><strong>Name:</strong> ${requestorName}</p>
            <p><strong>Email:</strong> ${requestorEmail}</p>
            <p><strong>Role:</strong> ${requestorRole}</p>
            <p><strong>Department:</strong> ${requestorDepartment || 'Not specified'}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Please log in to the Logixica ERP System to approve or reject this request.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="http://localhost:5173/dashboard/approval-requests" style="display: inline-block; background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096; text-align: center;">
            <p>This is an automated message from the Logixica ERP System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(message);
    console.log(`Approval request email sent to ${approverEmail}`);
  } catch (error) {
    console.error('Error sending approval request email:', error);
    // Don't throw the error, just log it to prevent breaking the registration flow
  }
};

// Send approval confirmation email to user
const sendApprovalEmail = async ({
  email,
  name,
  role,
  approverName,
  approverRole,
}) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `Logixica ERP <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your Account Has Been Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a5568;">Logixica ERP System</h2>
            <p style="color: #718096;">Account Approval Confirmation</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Hello ${name},</p>
            <p>Congratulations! Your account has been approved by ${approverName} (${approverRole}).</p>
            <p>You can now log in to the Logixica ERP System with your email and password.</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="http://localhost:5173/login" style="display: inline-block; background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
          </div>
          
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #4a5568;">Your Account Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${role}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096; text-align: center;">
            <p>This is an automated message from the Logixica ERP System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(message);
    console.log(`Approval confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending approval confirmation email:', error);
    // Don't throw the error, just log it to prevent breaking the approval flow
  }
};

// Send rejection email to user
const sendRejectionEmail = async ({
  email,
  name,
  role,
  rejectionReason,
  rejectorName,
  rejectorRole,
}) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `Logixica ERP <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your Account Registration Status',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a5568;">Logixica ERP System</h2>
            <p style="color: #718096;">Account Registration Status</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Hello ${name},</p>
            <p>We regret to inform you that your account registration request for the Logixica ERP System has not been approved by ${rejectorName} (${rejectorRole}).</p>
          </div>
          
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #4a5568;">Reason for Rejection:</h3>
            <p>${rejectionReason}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>If you believe this is an error or if you would like to provide additional information, please contact your department administrator.</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096; text-align: center;">
            <p>This is an automated message from the Logixica ERP System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(message);
    console.log(`Rejection email sent to ${email}`);
  } catch (error) {
    console.error('Error sending rejection email:', error);
    // Don't throw the error, just log it to prevent breaking the rejection flow
  }
};

export { sendApprovalRequestEmail, sendApprovalEmail, sendRejectionEmail };