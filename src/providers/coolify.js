export async function triggerCoolifyDeploy(env, subId) {
  let webhookUrl = env.COOLIFY_WEBHOOK;
  let token = env.COOLIFY_TOKEN;

  if (subId) {
    const upperId = subId.toUpperCase();
    webhookUrl = env[`COOLIFY_WEBHOOK_URL_${upperId}`];
    token = env[`COOLIFY_TOKEN_${upperId}`];
  }

  if (!webhookUrl || !token) {
    const target = subId ? `Coolify webhook URL or token for project '${subId}'` : "Default Coolify webhook URL or token";
    return {
      status: 500,
      body: { ok: false, error: `${target} is not configured` },
    };
  }

  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    const text = await r.text();
    let jsonResp;
    try {
      jsonResp = JSON.parse(text);
    } catch (e) {
      jsonResp = { response: text };
    }

    const httpStatus = r.ok ? 200 : (r.status >= 400 && r.status < 500 ? 400 : 502);

    return {
      status: httpStatus,
      body: { httpStatus: r.status, ...jsonResp },
    };
  } catch (error) {
    return {
      status: 500,
      body: { ok: false, error: "Failed to reach Coolify", details: error.message },
    };
  }
}
