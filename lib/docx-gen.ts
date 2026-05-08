import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export async function generateDeploymentGuide() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Deployment Guide: AI Studio Applet to Vercel",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "\nThis document provides step-by-step instructions to deploy your application to Vercel.",
                italics: true,
              }),
            ],
          }),
          
          new Paragraph({
            text: "1. Export Your Code",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: "In AI Studio, go to the Settings menu and choose 'Export to GitHub' or 'Download Project ZIP'. If you choose GitHub, Vercel can automatically redeploy when you push changes.",
          }),

          new Paragraph({
            text: "2. Set Up Vercel",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: "Log in to your Vercel account and click 'Add New' -> 'Project'. Import the repository you just created or upload the exported files.",
          }),

          new Paragraph({
            text: "3. Environment Variables",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: "During the Vercel setup, you will need to add the following Environment Variables:",
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• RESEND_API_KEY: ", bold: true }),
              new TextRun("Get this from your Resend dashboard."),
            ],
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• NEXT_PUBLIC_FIREBASE_API_KEY: ", bold: true }),
              new TextRun("Found in your Firebase project settings."),
            ],
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: "Note: Ensure you include all other NEXT_PUBLIC_ variables from your .env.example file.",
          }),

          new Paragraph({
            text: "4. Firebase Configuration",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: "Make sure you have correctly initialized Firebase. Since this app uses Firebase, you must ensure that your Firestore security rules are deployed to your Firebase project. You can find the rules in 'firestore.rules' in the project root.",
          }),

          new Paragraph({
            text: "5. Build and Deploy",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400 },
          }),
          new Paragraph({
            text: "Vercel automatically detects Next.js. The default build settings (npm run build) and output directory (.next) will work correctly.",
          }),

          new Paragraph({
            text: "\nSupport Information",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 800 },
          }),
          new Paragraph({
            text: "If you encounter issues, check the Vercel logs for build or runtime errors. Ensure your Resend API key is valid and not on trial restrictions if sending to external emails.",
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Deployment_Guide_Vercel.docx");
}
