import { getDb } from "@/db/client";
import { orNotFound, requireUser } from "@/lib/session";
import { assertCan } from "@/server/permissions";
import { assistantUsageToday } from "@/server/assistant";
import { getAssistantSettings, getListUnderDiscussion } from "@/server/settings";
import { assistantSettingsAction, settingsAction } from "../../actions";

export default async function SettingsPage() {
  const user = await requireUser();
  await orNotFound(() => assertCan(user, "settings.manage"));
  const db = await getDb();
  const listUnderDiscussion = await getListUnderDiscussion(db);
  const assistant = await getAssistantSettings(db);
  const used = await assistantUsageToday(db);
  return (
    <>
      <h1>Settings</h1>
      <form action={settingsAction} className="panel">
        <label className="check">
          <input type="checkbox" name="listUnderDiscussion" defaultChecked={listUnderDiscussion} />
          <span>Show Under discussion units on the public site, clearly labelled</span>
        </label>
        <button className="button" type="submit">
          Save
        </button>
      </form>

      <h2>Ask Adot</h2>
      {used >= assistant.dailyLimit && (
        <p className="alert warning" role="alert">
          The daily usage limit has been reached. Visitors see the fallback message until tomorrow.
        </p>
      )}
      <form action={assistantSettingsAction} className="panel">
        <label className="check">
          <input type="checkbox" name="enabled" defaultChecked={assistant.enabled} />
          <span>Show Ask Adot on the public site</span>
        </label>
        <div className="field">
          <label htmlFor="dailyLimit">Daily question limit</label>
          <input id="dailyLimit" name="dailyLimit" type="number" min="0" defaultValue={assistant.dailyLimit} />
          <span className="hint">Used today: {used}</span>
        </div>
        <div className="field">
          <label htmlFor="retentionDays">Delete chats after (days)</label>
          <input id="retentionDays" name="retentionDays" type="number" min="1" max="365" defaultValue={assistant.retentionDays} />
          <span className="hint">Counted from a chat's last message. Details visitors leave stay in the inbox.</span>
        </div>
        <div className="field">
          <label htmlFor="faqs">Approved FAQs</label>
          <textarea id="faqs" name="faqs" rows={8} maxLength={8000} defaultValue={assistant.faqs} />
          <span className="hint">
            Ask Adot can repeat anything written here to visitors, so include only verified public information.
          </span>
        </div>
        <button className="button" type="submit">
          Save
        </button>
      </form>
    </>
  );
}
