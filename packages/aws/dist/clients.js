"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEC2Client = getEC2Client;
exports.getSSMClient = getSSMClient;
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_ssm_1 = require("@aws-sdk/client-ssm");
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
let ec2Client = null;
let ssmClient = null;
function getEC2Client() {
    if (!ec2Client) {
        ec2Client = new client_ec2_1.EC2Client(clientConfig);
    }
    return ec2Client;
}
function getSSMClient() {
    if (!ssmClient) {
        ssmClient = new client_ssm_1.SSMClient(clientConfig);
    }
    return ssmClient;
}
