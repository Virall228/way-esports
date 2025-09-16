// Email service - simplified version without external dependencies

class EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      console.log(`Email would be sent to ${to}: ${subject}`);
      console.log(`Content: ${html}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendTournamentNotification(to: string, tournamentName: string, message: string): Promise<void> {
    const subject = `Tournament Update: ${tournamentName}`;
    const html = `
      <h2>Tournament Update</h2>
      <p><strong>Tournament:</strong> ${tournamentName}</p>
      <p>${message}</p>
      <p>Best regards,<br>WAY Esports Team</p>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendAchievementNotification(to: string, achievementName: string, points: number): Promise<void> {
    const subject = 'New Achievement Unlocked!';
    const html = `
      <h2>🎉 Achievement Unlocked!</h2>
      <p><strong>Achievement:</strong> ${achievementName}</p>
      <p><strong>Points Earned:</strong> ${points}</p>
      <p>Congratulations on your achievement!</p>
      <p>Best regards,<br>WAY Esports Team</p>
    `;

    await this.sendEmail(to, subject, html);
  }
}

export default new EmailService(); 