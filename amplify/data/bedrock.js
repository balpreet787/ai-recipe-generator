export function request(ctx) {
  const { ingredients = [] } = ctx.args;
  const prompt = `Suggest a recipe idea using these ingredients: ${ingredients.join(", ")}. Include a recipe name, ingredients, and cooking steps.`;

  return {
    resourcePath: "/model/us.amazon.nova-micro-v1:0/invoke",
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          maxTokens: 1000,
        },
      }),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return { error: ctx.error.message };
  }

  const parsedBody = JSON.parse(ctx.result.body);
  if (ctx.result.statusCode !== 200) {
    return {
      error: parsedBody.message || `Recipe service returned HTTP ${ctx.result.statusCode}.`,
    };
  }

  const content = parsedBody.output && parsedBody.output.message
    ? parsedBody.output.message.content || []
    : [];
  const text = content
    .filter((block) => block.text)
    .map((block) => block.text)
    .join("\n");

  return text ? { body: text } : { error: "The recipe service returned no text." };
}
