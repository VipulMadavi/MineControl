import { EC2Client } from "@aws-sdk/client-ec2";
import { SSMClient } from "@aws-sdk/client-ssm";

const region = process.env.AWS_REGION || "ap-south-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

const clientConfig = {
  region,
  credentials: accessKeyId && secretAccessKey ? {
    accessKeyId,
    secretAccessKey,
  } : undefined,
};


let ec2Client: EC2Client | null = null;
let ssmClient: SSMClient | null = null;

export function getEC2Client(): EC2Client {
  if (!ec2Client) {
    ec2Client = new EC2Client(clientConfig);
  }
  return ec2Client;
}

export function getSSMClient(): SSMClient {
  if (!ssmClient) {
    ssmClient = new SSMClient(clientConfig);
  }
  return ssmClient;
}
