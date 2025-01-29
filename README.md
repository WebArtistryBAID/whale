# Project Whale / Next

The ordering management platform of Whale Cafe. Built with Next.js.

## Get Started

To run in production:

* Using `pm2` allows for proper deployment in production.

To run in development:

* Ensure that you have node.js and npm available.
* Run `npm install`.
* Copy `.env.example` to `.env` and fill the following environment variables:

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

* Run `npm run dev`.

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

## TODO

* Allow "on-site order mode" - adjust available payment methods accordingly
* Add audit log everywhere
* Add user dashboard - view data, points, and allow adding balance
* Add settings for daily order cups cap, balance cap, per-order cap, etc.
* Add management dashboard for processing orders
* Add management dashboard for adding items
* Add management dashboard for modifying users (adding permissions, mostly)
* Add management dashboard for statistics
