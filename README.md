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

Whale manages online orders and café operations for The Whale Café at Beijing Academy. Customers can customize drinks
and follow their order status, while staff manage the menu and fulfill orders through the administration pages.

Whale is maintained by [WebArtistry @BAID](https://github.com/WebArtistryBAID). Authentication
uses [LinkBAID](https://github.com/WebArtistryBAID/baid-onelogin), and Weixin Pay is integrated through YunGouOS.

## Overview

* **Menu management.** Organize items into categories and associate tags. Configure prices or discounts for each item.
  Option types group choices such as size or sweetness; individual options can change an item's price or be marked sold
  out. Categories and items support drag reordering, as do choices within an option type.
* **Inventory and availability.** Each item supports either a tracked stock count or a manual sold-out flag. Items can
  also be exempt from the daily cup limit. Tracked stock is reserved when an order is created and restored when an
  unpaid order is cancelled or expires.
* **Ordering and fulfillment.** Customers build a cart and choose pickup or room delivery. Pickup offers morning,
  midday, or evening. The server calculates prices from the current menu and validates the selected options before
  accepting an order.
* **Payments and balances.** Customers can pay through Weixin Pay or a prepaid account balance. Eligible signed-in users
  can choose Pay Later when enabled. Staff can create on-site orders and record cash payments. Account balances can be
  recharged through Weixin Pay.
* **Store schedules.** Configure opening hours and preordering windows, with separate capacity limits. Staff can
  override availability for a particular date.
* **Staff dashboard.** View waiting orders and mark them complete. Staff can also process refunds for eligible paid
  orders within 90 days of creation. A protected JSON endpoint exposes the waiting-order data for external displays.
* **Customer accounts.** Signed-in customers can review their order history and balance. Points accrue when an order is
  paid, based on its price before coupon deductions. Inbox and SMS preferences control supported notifications,
  including pickup reminders and refund notices.
* **Administration and reporting.** Manage account permissions and review audit logs. Sales reports include revenue and
  order volume, with breakdowns by product or customer.
* **Bilingual interface.** English and Simplified Chinese are supported throughout the customer and administration
  pages. Uploaded images are converted to WebP.

### How Ordering Works

1. The customer selects menu items and chooses one option from each associated option type.
2. At checkout, they choose pickup or delivery, then select a payment method. A coupon can reduce the order total to
   zero.
3. Whale checks the store's availability and capacity. It also verifies current stock and calculates the price using
   database records.
4. Creating the order reserves tracked stock and consumes the coupon use. The order starts with fulfillment status
   `waiting` and payment status `notPaid` or `paid`.
5. Balance payments and recorded cash payments are marked paid immediately, as are zero-total orders. Weixin payments
   become paid after Whale verifies the payment notification. Pay Later orders remain unpaid while entering the
   preparation queue.
6. The waiting-order dashboard includes paid orders and unpaid Pay Later orders. Staff mark fulfillment status `done`
   when preparation is complete, and customers can follow progress on their order page.

Ordinary unpaid orders older than one hour are removed when the cleanup job runs. Pay Later orders remain available for
settlement, and their reminder job runs separately. Both jobs require an external scheduler.

## Development

To run in development:

1. Install Node.js 24 or later and npm.
2. Copy `.env.example` to `.env`, then run `npm install`.
3. Create a PostgreSQL database and set `DATABASE_URI` in `.env`.
4. Set `HOST=http://localhost:3000`, `UPLOAD_PATH=public/uploads`, and `UPLOAD_SERVE_PATH=uploads`.
5. Configure a local or approved LinkBAID application with `scope=basic+phone+sms`. Register `${HOST}/login/authorize`
   as its OAuth callback, and fill the `ONELOGIN_*` variables.
6. Generate `JWT_SECRET` with `openssl rand -hex 32`. Fill the remaining environment variables for the integrations you
   plan to use.
7. Apply the migrations and generate the client:

   ```sh
   npx prisma migrate deploy
   npx prisma generate
   ```

8. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

Sign in through LinkBAID to create your user record. Grant the first staff account the `admin.manage` permission
directly in the database; that account can then manage permissions through `/user/manage/users`.

Leaving the Weixin merchant configuration empty provides placeholder payment responses for development. Actual payments
and balance recharges require the merchant configuration and reachable callback endpoints.

### Database Migrations

The initial schema is tracked in `prisma/migrations`. The generated Prisma client belongs in `src/generated` and is
ignored by Git.

* After pulling existing migrations, run `npx prisma migrate deploy`, followed by `npx prisma generate`.
* To change the schema locally, edit `prisma/schema.prisma` and run `npx prisma migrate dev --name describe_change`.
  Regenerate the client with `npx prisma generate`, and commit the schema together with its migration files.
* For production updates, run `npx prisma migrate deploy`, then `npx prisma generate`, before building and restarting
  Whale.

## Production

To run in production:

1. Install Node.js 24 or later and npm, then copy `.env.example` to `.env`.
2. Configure PostgreSQL and set `DATABASE_URI`. Set `HOST` to the public HTTPS origin, such as
   `https://cafe.example.com`.
3. Configure the approved LinkBAID application and its OAuth callback. Generate separate random values for `JWT_SECRET`
   and `CRON_KEY`.
4. Set `UPLOAD_PATH` to a persistent, writable directory. Set `UPLOAD_SERVE_PATH` to the corresponding public URL
   segment, such as `uploads`.
5. Configure the YunGouOS Weixin merchant credentials. Keep the payment callback routes reachable at
   `${HOST}/order/checkout/wechat/notify` and `${HOST}/balance/notify`.
6. Install dependencies and prepare the application:

   ```sh
   npm ci
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   ```

7. Start Whale with a process manager, for example:

   ```sh
   pm2 start npm --name whale -- run start
   pm2 save
   pm2 startup
   ```

8. Configure HTTPS through a reverse proxy. `npm run start` serves Whale on port `52323`.
9. Configure the scheduled jobs below. Sign in and grant the initial staff account `admin.manage` if this is a fresh
   database.

An example Nginx configuration for the application and uploaded images:

```nginx
server {
    listen 443 ssl;
    server_name cafe.example.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    client_max_body_size 11M;

    location ^~ /uploads/ {
        alias /srv/whale/uploads/;
        autoindex off;
        add_header X-Content-Type-Options nosniff always;
    }

    location / {
        proxy_pass http://127.0.0.1:52323;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

For this configuration, set `UPLOAD_PATH=/srv/whale/uploads` and `UPLOAD_SERVE_PATH=uploads`. The upload endpoint
accepts images up to 10 MiB; the proxy allowance also covers multipart overhead.

### Scheduled Jobs

Configure an external scheduler to send GET requests with `key=${CRON_KEY}`. The suggested schedules are:

| Endpoint           | Schedule         | Action                                                                           |
|--------------------|------------------|----------------------------------------------------------------------------------|
| `/order/prune`     | Every 30 minutes | Remove ordinary unpaid orders older than one hour and restore tracked inventory. |
| `/balance/prune`   | Every 30 minutes | Remove unfinished balance recharge records older than one hour.                  |
| `/order/pay-later` | Daily at 20:00   | Send reminders for eligible outstanding Pay Later orders.                        |

For example, a scheduler can invoke:

```sh
curl -fsS "${HOST}/order/prune?key=${CRON_KEY}"
```

Configure the application server and scheduler to use the café's business timezone. Opening schedules and business-day
calculations use the application server's local time.

## Environment Variables

| Name                     | Description                                                                                                             |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `DATABASE_URI`           | PostgreSQL connection URI. The database must exist before applying migrations.                                          |
| `HOST`                   | Public application origin, with no trailing slash. Use `http://localhost:3000` in development.                          |
| `UPLOAD_PATH`            | Writable directory for uploaded images. Use `public/uploads` in development or a persistent directory in production.    |
| `UPLOAD_SERVE_PATH`      | Public URL segment for uploaded images, with no surrounding slashes. Use `uploads` for URLs beginning with `/uploads/`. |
| `ONELOGIN_HOST`          | LinkBAID server origin, with no trailing slash.                                                                         |
| `ONELOGIN_CLIENT_ID`     | LinkBAID application ID with approved access to `scope=basic+phone+sms`.                                                |
| `ONELOGIN_CLIENT_SECRET` | LinkBAID application secret.                                                                                            |
| `JWT_SECRET`             | Secret used to sign login sessions and guest order access. Generate with `openssl rand -hex 32`.                        |
| `WX_PAY_MCH_ID`          | YunGouOS Weixin Pay merchant ID.                                                                                        |
| `WX_PAY_MCH_KEY`         | Payment signing key for that merchant.                                                                                  |
| `CRON_KEY`               | Secret required by the scheduled-job endpoints. Generate with `openssl rand -hex 32`.                                   |
| `WAITING_ORDERS_API_KEY` | Secret required to access the waiting-orders JSON endpoint.                                                             |
| `BOTTOM_TEXT`            | Optional text displayed in the footer's registration link.                                                              |

## Settings

Staff can edit these values at `/user/manage/settings`. The defaults below are created automatically when settings are
first loaded.

| Key                              | Default      | Description                                                       |
|----------------------------------|--------------|-------------------------------------------------------------------|
| `enable-scheduled-availability`  | `true`       | Apply the configured opening schedule.                            |
| `weekdays-only`                  | `true`       | Limit scheduled business days to Monday through Friday.           |
| `open-time`                      | `10:00`      | Opening time in the application server's timezone.                |
| `close-time`                     | `15:00`      | Closing time in the application server's timezone.                |
| `pre-order-start-time`           | `10:00`      | Beginning of the preorder window for a business day.              |
| `store-open`                     | `true`       | Manual open/closed state when scheduled availability is disabled. |
| `availability-override-date`     | `0000-00-00` | Date for a manual availability override, using `YYYY-MM-DD`.      |
| `availability-override-value`    | `false`      | Open or closed state for the override date.                       |
| `maximum-cups-per-order`         | `2`          | Maximum total item quantity in one order.                         |
| `maximum-cups-per-day`           | `14`         | Capacity allocated to orders placed during the live window.       |
| `maximum-pre-order-cups-per-day` | `0`          | Capacity allocated to preorders for a business day.               |
| `maximum-balance`                | `500`        | Balance ceiling checked when starting a recharge, in yuan.        |
| `balance-recharge-minimum`       | `20`         | Minimum recharge amount, in yuan.                                 |
| `allow-delivery`                 | `true`       | Enable delivery to a room.                                        |
| `allow-pay-later`                | `true`       | Enable Pay Later for eligible signed-in users.                    |

Preordering requires a capacity greater than zero and a window before the target business day's opening time. If
`pre-order-start-time` falls at or after `open-time`, the window begins on the previous business day; weekday scheduling
can therefore extend a window across a weekend.

Preorders consume their own capacity allocation. At opening, unused preorder capacity is added to that day's live
capacity. Each business day has its own allocation, and products marked exempt contribute zero toward the daily limit.
Unpaid orders also reserve daily capacity until they are deleted. A manual closure for the current date closes ordering,
including preordering during that override.

## Waiting Orders API

`GET /api/waiting-orders` returns the same orders as the staff waiting-order dashboard: paid orders awaiting fulfillment
and unpaid Pay Later orders awaiting fulfillment. Results are ordered by creation time, newest first.

Provide `WAITING_ORDERS_API_KEY` through the `x-api-key` header or an `Authorization: Bearer` header:

```sh
curl -fsS \
  -H "x-api-key: ${WAITING_ORDERS_API_KEY}" \
  "${HOST}/api/waiting-orders"
```

The response is an array of orders. Each includes `items` and `user`; each ordered item includes its `itemType` and
`appliedOptions`. The API key grants access to customer data in these records, so keep it within trusted staff displays
or backend integrations.

## Contribution

Contributions are welcome through pull requests. Run `npm run lint` and `npx tsc --noEmit` before submitting changes,
and include migration files whenever the database schema changes.

## License

Copyright © 2026 Team WebArtistry. Whale is licensed under
the [GNU General Public License, version 3 or later](https://www.gnu.org/licenses/gpl-3.0.html).

<br>

<div align="center">
  <img src="public/assets/logo.png" alt="" width="40">
</div>
