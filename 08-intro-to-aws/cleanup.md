# Clean Up

Do this at the end of the session so nothing keeps running or costs money.

## 1. Terminate the EC2 instance

1. Open **EC2** > **Instances**.
2. Select `crumb-orders`.
3. Click **Instance state** > **Terminate (delete) instance** and confirm.

The disk is deleted with it.

## 2. Delete the S3 bucket

1. Open **S3** and select your bucket.
2. Click **Empty**, type `permanently delete`, and confirm.
3. Select the bucket again, click **Delete**, type the bucket name, and confirm.

A bucket must be empty before you can delete it.

## 3. Check every region

Search for **EC2 Global View** in the top search bar. It lists instances in every region. If one is still running somewhere else, switch to that region and repeat step 1.

## Keep

- Your IAM user and the `admins` group. They are free. Use this user instead of root from now on.
