export type Mail = { to: string; subject: string; text: string };

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** Logs instead of sending. The real provider is open decision O-09. */
export const consoleMailer: Mailer = {
  async send(mail) {
    if (process.env.MAIL_SIMULATE_FAILURE === "1") throw new Error("Simulated mail outage");
    console.log(`[mail] to=${mail.to} subject=${mail.subject}`);
  },
};
