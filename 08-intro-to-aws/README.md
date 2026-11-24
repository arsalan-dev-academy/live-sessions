# Introduction to AWS

## Session Overview

In this session you play the first cloud engineer at **Crumb & Co.**, a small bakery that wants to move online. The owner has three requests. Each one is a short task in the AWS Console.

You will work with:
- **IAM** to give the team safe access to the account
- **S3** to host the bakery's website
- **EC2** to run a small web server

By the end of the session, you should be able to:
- Explain why you should not use the root user day to day
- Create an IAM user and sign in with it
- Host a static website from an S3 bucket
- Launch an EC2 instance, connect to it, and serve a web page
- Clean up so you are not charged

## Prerequisites

- An [AWS account](https://aws.amazon.com/free/) (the root user email and password)
- A web browser
- A text editor

No code or local tools are needed. Everything happens in the AWS Console.

## The Scenario

Crumb & Co. just opened an AWS account. Right now everyone shares the owner's login, there is no website, and the new order system has nowhere to run.

| # | Request | Task |
|---|---|---|
| 1 | "Stop using my login for everything." | [01-iam-user](01-iam-user/) |
| 2 | "We need a simple website with our menu." | [02-s3-website](02-s3-website/) |
| 3 | "Our order system needs a server." | [03-ec2-server](03-ec2-server/) |

Each task folder has a `README.md` with the request and your task. The `SOLUTION.md` next to it is the step-by-step walkthrough we go through at the end.

When you are done: [cleanup.md](cleanup.md)

## Key Terms

| Term | Meaning |
|---|---|
| Region | A geographic area with AWS data centers, e.g. Europe (Frankfurt) `eu-central-1` |
| Root user | The account owner login. Full power, cannot be limited. |
| IAM user | A login you create for a person, with only the permissions you give it |
| S3 bucket | A container for files (objects) in S3 |
| EC2 instance | A virtual server |
| Security group | A firewall that controls traffic to an instance |

## Ground Rules

- **Stay on the free tier.** Only pick options marked "Free tier eligible".
- **Use one region for everything.** Check the region menu in the top-right corner before each task.
- **Clean up at the end.** Follow [cleanup.md](cleanup.md) so nothing keeps running.
