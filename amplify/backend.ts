import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { data } from "./data/resource";
import { auth } from "./auth/resource";

const backend = defineBackend({
  auth,
  data,
});

const region = "us-west-2";
const modelId = "amazon.nova-micro-v1:0";
const inferenceProfileId = `us.${modelId}`;
const stack = Stack.of(backend.data.resources.graphqlApi);

const inferenceProfileArn =
  `arn:aws:bedrock:${region}:${stack.account}:inference-profile/${inferenceProfileId}`;

const bedrockDataSource =
  backend.data.resources.graphqlApi.addHttpDataSource(
    "bedrockDS",
    `https://bedrock-runtime.${region}.amazonaws.com`,
    {
      authorizationConfig: {
        signingRegion: region,
        signingServiceName: "bedrock",
      },
    }
  );

bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: [inferenceProfileArn],
  })
);

bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:us-east-1::foundation-model/${modelId}`,
      `arn:aws:bedrock:us-east-2::foundation-model/${modelId}`,
      `arn:aws:bedrock:us-west-2::foundation-model/${modelId}`,
    ],
    conditions: {
      StringEquals: {
        "bedrock:InferenceProfileArn": inferenceProfileArn,
      },
    },
  })
);
