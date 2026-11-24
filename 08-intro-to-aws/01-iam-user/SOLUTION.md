# Task 1: Solution Walkthrough

Sign in as the **root user** for this task only.

## 1. Open IAM

1. In the search bar at the top, type `IAM` and open it.
2. IAM is global, so the region menu shows "Global". That is expected.

## 2. Create the user and group

1. Go to **Users** and click **Create user**.
2. User name: your name, for example `sara`.
3. Check **Provide user access to the AWS Management Console**.
4. If asked, choose **I want to create an IAM user**.
5. Choose **Custom password** and enter one. You can uncheck "must create a new password at next sign-in".
6. Click **Next**.
7. Choose **Add user to group**, then **Create group**.
   - Group name: `admins`
   - Policy: check **AdministratorAccess**
   - Click **Create user group**.
8. Select the `admins` group and click **Next**.
9. Click **Create user**.

## 3. Save the sign-in details

The last page shows a **Console sign-in URL**. It looks like this:

```
https://123456789012.signin.aws.amazon.com/console
```

Copy it, or click **Download .csv file**. You need it to sign in as the IAM user.

## 4. Sign in as the IAM user

1. Click your account name in the top-right corner and choose **Sign out**.
2. Open the sign-in URL you saved.
3. Enter your IAM user name and password.

The top-right corner now shows your IAM user name. Use this user from now on.

## Why this matters

- The root user can do anything, including close the account. Keep it locked away.
- Each person gets their own user, so you can see who did what.
- Permissions are given to the **group**, not each user. A new admin just joins the group.
- Good practice: turn on MFA for the root user and your IAM user (IAM > Users > your user > **Security credentials**).
