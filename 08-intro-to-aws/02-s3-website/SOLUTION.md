# Task 2: Solution Walkthrough

Signed in as your **IAM user**. Check the region in the top-right corner.

## 1. Create the page

In a text editor, save this as `index.html`:

```html
<h1>Crumb & Co.</h1>
<p>Fresh bread every morning.</p>
<ul>
  <li>Sourdough loaf</li>
  <li>Croissant</li>
  <li>Cinnamon roll</li>
</ul>
```

## 2. Create the bucket

1. Open **S3** and click **Create bucket**.
2. Bucket name: something unique, for example `crumb-and-co-sara`. Names are global, so they must be unique across all of AWS.
3. Leave the other settings as they are and click **Create bucket**.

## 3. Upload the page

1. Open the bucket and click **Upload**.
2. Add `index.html` and click **Upload**.

## 4. Turn on website hosting

1. Go to the bucket's **Properties** tab.
2. Scroll to **Static website hosting** and click **Edit**.
3. Choose **Enable**.
4. Index document: `index.html`
5. Click **Save changes**.

## 5. Allow public access

By default, everything in S3 is private. A website must be public.

1. Go to the **Permissions** tab.
2. Under **Block public access**, click **Edit**, uncheck **Block all public access**, and save. Type `confirm` when asked.
3. Under **Bucket policy**, click **Edit** and paste this. Replace `BUCKET-NAME` with your bucket name:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET-NAME/*"
    }
  ]
}
```

4. Click **Save changes**.

The policy says: anyone (`*`) can read (`s3:GetObject`) any file in this bucket.

## 6. Open the website

1. Go back to **Properties** > **Static website hosting**.
2. Click the **Bucket website endpoint** URL.

You should see the menu.

## Troubleshooting

| You see | Fix |
|---|---|
| `403 Forbidden` | Check Block public access is off and the bucket policy has your exact bucket name. |
| `404 Not Found` | Check the file is named `index.html` and the index document matches. |
| The file downloads instead of opening | Use the website endpoint URL, not the object URL. |
