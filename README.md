# Project Whale / Next

The ordering management platform of Whale Cafe. Built with Next.js.

## Get Started

To run in production:

* Using `pm2` allows for proper deployment in production.
* Remember to set the environment variables.
* Set up scheduled tasks.

To run in development:

* Ensure that you have node.js and npm available.
* Run `npm install`.
* Copy `.env.example` to `.env` and fill the environment variables.
* Run `npm run dev`.

## Environment Variables

| Name                     | Description                                                                                                     |
|--------------------------|-----------------------------------------------------------------------------------------------------------------|
| `DATABASE_URI`           | The database URI to use. PostgreSQL is required.                                                                |
| `JWT_SECRET`             | The JWT secret key to use. You can generate one with `openssl rand -hex 32`.                                    |
| `HOST`                   | The location where this service is hosted. No trailing slashes.                                                 |
| `UPLOAD_PATH`            | The directory where uploaded files are stored. In development, this is `public/uploads`.                        |
| `UPLOAD_SERVE_PATH`      | The path where uploaded files are served. In development, this is `uploads`.                                    |
| `BOTTOM_TEXT`            | In case you need this.                                                                                          |
| `ONELOGIN_HOST`          | The location where [OneLogin](https://github.com/WebArtistryBAID/baid-onelogin) is hosted. No trailing slashes. |
| `ONELOGIN_CLIENT_ID`     | OneLogin client ID. `basic`, `phone`, and `sms` scopes are required.                                            |
| `ONELOGIN_CLIENT_SECRET` | OneLogin client secret.                                                                                         |
| `WXPAY_MCH_ID`           | Weixin Pay merchant ID.                                                                                         |
| `WXPAY_MCH_KEY`          | Weixin Pay signature key.                                                                                       |
| `CRON_KEY`               | Cron task verification key.                                                                                     |

## Cron Tasks

For each task, you need to pass the query parameter `key={CRON_KEY}`.

| Path             | Time             | Description                         |
|------------------|------------------|-------------------------------------|
| `/order/prune`   | Every 30 minutes | Delete unpaid orders.               |
| `/balance/prune` | Every 30 minutes | Delete unpaid balance transactions. |

## Settings

| Key                             | Type    | Description                                                                                       |
|---------------------------------|---------|---------------------------------------------------------------------------------------------------|
| `enable-scheduled-availability` | boolean | Whether or not to use a schedule for making the store available.                                  |
| `weekdays-only`                 | boolean | When `enable-scheduled-availability` is on, whether to only make the store available on weekdays. |
| `open-time`                     | HH:mm   | When `enable-scheduled-availability` is on, the time when the store opens.                        |
| `close-time`                    | HH:mm   | When `enable-scheduled-availability` is on, the time when the store closes.                       |
| `store-open`                    | boolean | When `enable-scheduled-availability` is off, whether the store is currently open.                 |
| `maximum-cups-per-order`        | number  | The maximum number of cups that can be ordered in a single order.                                 |
| `maximum-cups-per-day`          | number  | The maximum number of cups that can be ordered in a single day.                                   |
| `maximum-balance`               | Decimal | The maximum balance that a user can have.                                                         |
| `balance-recharge-minimum`      | Decimal | The minimum amount that can be recharged.                                                         |

## Contribution

To contribute, simply open a pull request.

## License

```
    The ordering management platform for Whale Cafe.
    Copyright (C) 2025  Team WebArtistry

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
