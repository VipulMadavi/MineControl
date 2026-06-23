import { EC2Client } from "@aws-sdk/client-ec2";
import { SSMClient } from "@aws-sdk/client-ssm";
export declare function getEC2Client(): EC2Client;
export declare function getSSMClient(): SSMClient;
