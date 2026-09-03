import { resend } from "../../config/resend.js";
import { generateOtpEmailTemplate } from "./otpEmail.template.js";
import { AppError } from "../../utils/AppError.js";

export const sendVerificationEmail = async (
  userEmail: string,
  username: string,
  otpCode: string
) => {
  try {
    const htmlContent = generateOtpEmailTemplate(otpCode, username);

    const { data, error } = await resend.emails.send({
      from: `onboarding@resend.dev`,
      to: userEmail,
      subject: "Verify your PulseTrack account",
      html: htmlContent,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new AppError("Failed to send verification email", 500);
    }

    return data;
  } catch (error) {
    console.error("Email Service Error:", error);
    throw new AppError("Internal server error while sending email", 500);
  }
};
