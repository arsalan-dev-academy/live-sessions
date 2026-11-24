# Task 3: Solution Walkthrough

Signed in as your **IAM user**. Check the region in the top-right corner.

## 1. Launch the instance

1. Open **EC2** and click **Launch instance**.
2. Name: `crumb-orders`
3. Image (AMI): **Amazon Linux 2023** (marked "Free tier eligible").
4. Instance type: the one marked **Free tier eligible** (`t2.micro` or `t3.micro`, depending on the region).
5. Key pair: **Proceed without a key pair**. We connect from the browser instead.

## 2. Set up the firewall

Under **Network settings**, a new security group is created for you.

1. Keep **Allow SSH traffic from** checked, set to **Anywhere**. The browser connection needs it.
2. Check **Allow HTTP traffic from the internet**.

Leave storage as it is and click **Launch instance**.

## 3. Connect from the browser

1. Click **View all instances**.
2. Wait until **Instance state** is `Running` and **Status check** shows checks passed (about a minute).
3. Select the instance and click **Connect**.
4. On the **EC2 Instance Connect** tab, click **Connect**.

A terminal opens in a new tab.

## 4. Install a web server

Run these commands in that terminal:

```bash
sudo dnf install -y nginx                   # install the nginx web server
sudo systemctl enable --now nginx           # start it now and on every reboot
echo "<h1>Crumb & Co. Orders</h1>" | sudo tee /usr/share/nginx/html/index.html
```

## 5. Open the page

1. Back in the EC2 console, select the instance.
2. Copy the **Public IPv4 address**.
3. Open `http://<public-ip>` in your browser.

Use `http://`, not `https://`. We only opened port 80.

## How it fits together

```
 Browser  --- port 80 --->  Security group  --->  EC2 instance
                            (allows 22, 80)       (nginx)
```

The security group is the firewall. If a port is not allowed there, the traffic never reaches the instance.

## Troubleshooting

| You see | Fix |
|---|---|
| Page keeps loading, then times out | Check the security group allows HTTP (port 80) and you used `http://`. |
| Instance Connect fails | Check the security group allows SSH (port 22) from Anywhere and the instance is `Running`. |
| Default nginx page instead of yours | Re-run the `echo ... tee` command and refresh. |
