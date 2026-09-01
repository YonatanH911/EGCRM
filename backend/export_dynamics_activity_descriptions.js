/*
Run this entire script in the browser console while signed in to Dynamics.
It reads activity descriptions through the Dynamics Web API and downloads JSON.
No Dynamics records are changed.
*/
(async () => {
  const clientUrl =
    globalThis.Xrm?.Utility?.getGlobalContext?.().getClientUrl?.() || location.origin;
  const fields = "activityid,subject,description,scheduledstart,scheduledend";
  let nextUrl =
    `${clientUrl}/api/data/v9.2/activitypointers` +
    `?$select=${fields}&$filter=description ne null`;
  const activities = [];

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Prefer: "odata.maxpagesize=5000",
      },
    });
    if (!response.ok) {
      throw new Error(`Dynamics API request failed: ${response.status} ${response.statusText}`);
    }

    const page = await response.json();
    for (const activity of page.value) {
      const document = new DOMParser().parseFromString(activity.description || "", "text/html");
      activities.push({
        activityid: activity.activityid,
        subject: activity.subject || "",
        description: (document.body.innerText || document.body.textContent || "")
          .replace(/\r\n/g, "\n")
          .trim(),
        scheduledstart: activity.scheduledstart,
        scheduledend: activity.scheduledend,
      });
    }
    nextUrl = page["@odata.nextLink"] || null;
    console.log(`Collected ${activities.length} activity descriptions...`);
  }

  const payload = {
    exported_at: new Date().toISOString(),
    dynamics_url: clientUrl,
    count: activities.length,
    activities,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `dynamics_activity_descriptions_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  console.log(`Downloaded ${activities.length} activity descriptions.`);
})().catch((error) => {
  console.error("Activity description export failed.", error);
  alert(`Activity description export failed: ${error.message}`);
});
