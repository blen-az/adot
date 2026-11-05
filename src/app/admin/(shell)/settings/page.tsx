import { getDb } from "@/db/client";
import { orNotFound, requireUser } from "@/lib/session";
import { assertCan } from "@/server/permissions";
import { getListUnderDiscussion } from "@/server/settings";
import { settingsAction } from "../../actions";

export default async function SettingsPage() {
  const user = await requireUser();
  await orNotFound(() => assertCan(user, "settings.manage"));
  const listUnderDiscussion = await getListUnderDiscussion(await getDb());
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
    </>
  );
}
