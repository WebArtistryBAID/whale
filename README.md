<div align="center">

<img src="public/assets/logo.png" alt="Project Whale" width="120">

# Project Whale

The ordering management platform for The Whale Café. Built with Next.js.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-required-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

[Overview](#overview) · [Development](#development) · [Production](#production) · [Environment Variables](#environment-variables) · [Settings](#settings) · [Contribution](#contribution) · [License](#license)

</div>

Project Whale is a customized ordering system for The Whale Café, a student-run coffee shop at BAID.

Project Whale is maintained by [WebArtistry @BAID](https://github.com/WebArtistryBAID). Authentication
uses [LinkBAID](https://github.com/WebArtistryBAID/baid-onelogin), and Weixin Pay is integrated through YunGouOS. It was
originally developed by Lin Donglai.

## Overview

* **Menu management.** Organize items into categories and add tags to them. Configure prices and discounts for each
  item.
  Add options such as size or temperature that may modify the price of each item. Reorder these items as you will. Add
  images to each item. Exempt any item you want from the quotas.
* **Ordering.** Customers build a cart and can choose pick-up or delivery. When choosing pick-up, the customer can
  specify
  a pick-up time: morning, afternoon, or evening. Customers do not need to log in to order.
* **Automated payments.** Customers could pay with Weixin Pay, or sign up for an account to recharge and pay with their
  balance.
  All three forms of Weixin Pay (QR code, in-WeChat payment, redirect-to-WeChat payment) are supported. If enabled,
  customers
  can "Pay Later." They cannot order another cup with Pay Later before settling existing bills.
* **Coupon codes.** Generate as many coupon codes as you like, which can reduce the amount of money customers pay for a
  drink. Coupon codes are automatically consumed when customers use them.
* **Customer accounts.** Customers can sign in with Seiue LMS or Feishu via LinkBAID. Signed-in customers can review
  their order
  history and balance. Customers also accrue points when they pay for an order.
* **On-site ordering.** Turn on "on-site ordering mode" on staff devices. They can then help customers visiting
  in-person order, either with cash or Weixin Pay.
* **Staff dashboard.** A simple UI to view waiting orders and mark them complete. Easily refund orders and view their
  payment status.
* **Opening hours.** Manually open the store only. Or set a fixed time period everyday where live-ordering is available.
  Or allow
  ordering only during weekdays. Easily override opening hours for one specific day on the staff interface—they revert
  on the next day.
* **Quota management.** Set a fixed number of cups that the store can make in a day, and stop accepting further orders
  when
  it is reached.
* **Pre-orders.** Set a "pre-order" period where the store does not make drinks but customers can still place orders.
  Set a pre-order quota, separate from the live-ordering quota, that carries into the live-ordering quota if not
  completely
  consumed.
* **Inventory management.** Each item can either have a tracked stock count, which is automatically reserved upon
  payment. The stock count is restored if the order is cancelled or refunded. Or you can use a manual sold-out option
  without automatic trackking.
* **Advertisements.** Add promotion images, links, and text to the menu.
* **Administration.** Audit logs for all website operations. Statistics reporting include analysis per gender, user,
  categories, items, and more. Configurable reporting periods and predefined statistic breakdown.
* **Bilingual interface.** English and Chinese are supported throughout the user interface.

## Development

To run in development:

1. Install Node.js and npm.
2. Copy `.env.example` to `.env`.
3. Run `npm install`.
4. Set up a PostgreSQL database and set `DATABASE_URI` in `.env`.
5. Set `HOST=http://localhost:3000`, `UPLOAD_PATH=public/uploads`, and `UPLOAD_SERVE_PATH=uploads`.
6. Apply Prisma migrations and generate the client:

   ```sh
   prisma migrate deploy
   prisma generate
   ```
7. Run a development server of [LinkBAID](https://github.com/WebArtistryBAID/baid-onelogin) to support authentication or
   use the official LinkBAID server by informing your school point of contact. When you create a LinkBAID application,
   you must enable the scopes `basic`, `phone`, and `sms`, and register `${HOST}/login/authorize` as an OAuth2 redirect
   URI.
8. Fill the remaining environment variables.
9. Run `npm run dev` to start the development server.

In development mode, Weixin Pay will not work, because you will not be able to set up a valid merchant ID. Use "Pay
Later" for debugging instead.

### Database Migrations

* After pulling someone else's migrations, run `prisma migrate deploy`, then `prisma generate`.
* To create your own migration, edit `prisma/schema.prisma` and run `prisma migrate dev --name describe_change`. Commit
  the schema and the entire `prisma/migrations/` directory together.
* On production, run `prisma migrate deploy`, then `prisma generate` before building and restarting Project Whale.
  **Monitor the messages carefully, do NOT reset the database!**

## Production

To run in production:

1. Install Node.js and npm.
2. Copy `.env.example` to `.env`.
3. Run `npm install`.
4. Set up a PostgreSQL database and set `DATABASE_URI` in `.env`.
5. For a fresh database, run `prisma migrate deploy`.
6. Run `prisma generate`.
7. Gain access to the production LinkBAID server.
    * **LinkBAID server**: You must create a LinkBAID application with the following scopes: `basic`, `phone`, and
      `sms`. This app must be approved before continuing.
8. Gain access to the YunGouOS Weixin Pay merchant account.
    * You must have a domain name registered with a Chinese ISP and with ICP registration completed. You must also have
      a server in mainland China that is tied to this domain name.
    * You must run the website first by following the remaining steps before you can create a YunGouOS merchant account.
    * Creating this account requires a Chinese citizen with a national ID and a Chinese bank account. You must choose
      "渠道商户" for the account type.
    * After creating the account, you must contact YunGouOS staff to complete a video verification before you can use
      the account.
    * After verification, you must contact YunGouOS staff again to enable H5 payments for the account.
    * You must add the domain name you are running on to the H5 payment callback authorized domain list.
    * Congratulations, after taking around 1-2 weeks on this you will finally be able to access Weixin Pay without
      having a company registered.
9. Set up a cron task that triggers the scheduled jobs below. The cron task must send GET requests with
   `key=${CRON_KEY}`.
10. Fill the remaining environmental variables.
11. Run `npm run build` to build the production server.
12. Using `pm2`, run `pm2 start npm --name whale -- run start` to start the production server. You can also use
    `pm2 save` to save the process list and `pm2 startup` to configure it to start on boot.
13. Whale runs on port 52323 by default.
14. Create a reverse proxy with Nginx as appropriate such that Nginx handles HTTPS and serves static files. An example
    Nginx configuration is shown below. HTTPS can usually be configured with Let's Encrypt.

```nginx
server {
    listen 443 ssl;
    server_name cafe.example.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    client_max_body_size 11M;

    location ^~ /uploads/ {
        alias /home/web/whale/uploads/;  # By setting up Nginx to serve files from /uploads/, we must set `UPLOAD_SERVE_PATH` to `/uploads` (users access uploaded files on `https://.../uploads/...`) and `UPLOAD_PATH` to `uploads` (uploaded files are saved to `/home/web/whale/uploads/`)
        autoindex off;
        add_header X-Content-Type-Options nosniff always;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://localhost:52323;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

15. Log in with LinkBAID.
16. Configure your account in the database directly: add permission `admin.manage`.
17. Completed! You can now add the products and configure store opening times.

### Cron Jobs

| Endpoint           | Schedule         | Action                                                                           |
|--------------------|------------------|----------------------------------------------------------------------------------|
| `/order/prune`     | Every 30 minutes | Remove ordinary unpaid orders older than one hour and restore tracked inventory. |
| `/balance/prune`   | Every 30 minutes | Remove unfinished balance recharge records older than one hour.                  |
| `/order/pay-later` | Daily at 20:00   | Send reminders for outstanding Pay Later orders.                                 |

## Environment Variables

| Name                     | Description                                                                                                                                      |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `DATABASE_URI`           | The database URI to use. PostgreSQL is required.                                                                                                 |
| `HOST`                   | The absolute URI where Whale is hosted. No trailing slashes. For example, `http://localhost:3000` in development.                                |
| `UPLOAD_PATH`            | The directory where uploaded files are stored. In development, use `public/uploads` to have the Next.js development server serve uploaded files. |
| `UPLOAD_SERVE_PATH`      | The relative URI where uploaded files are served. In development, this is `uploads`.                                                             |
| `ONELOGIN_HOST`          | The URI where LinkBAID is hosted. No trailing slashes.                                                                                           |
| `ONELOGIN_CLIENT_ID`     | LinkBAID client ID.                                                                                                                              |
| `ONELOGIN_CLIENT_SECRET` | LinkBAID client secret.                                                                                                                          |
| `JWT_SECRET`             | The JWT secret key to use. You can generate one with `openssl rand -hex 32`.                                                                     |
| `WX_PAY_MCH_ID`          | YunGouOS Weixin Pay merchant ID.                                                                                                                 |
| `WX_PAY_MCH_KEY`         | YunGouOS Weixin Pay signing key.                                                                                                                 |
| `CRON_KEY`               | Secret key required by cron-only API endpoints. Generate one with `openssl rand -hex 32`.                                                        |
| `BOTTOM_TEXT`            | ICP registration number, if it is necessary to display.                                                                                          |


## Contribution

Contributions are welcome through pull requests!

## License

Copyright © 2026 Team WebArtistry. Project Whale is licensed under
the [GNU General Public License, version 3 or later](https://www.gnu.org/licenses/gpl-3.0.html).