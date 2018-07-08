# Uni WC Hub Application (server-side)

Uni WC Hub App is a server-side web application built on [Node.js](https://nodejs.org/en/) and [hapijs framework](https://hapijs.com/). Its main purpose is to serve as a hub and source of data for [Uni WC Hub client-side app](https://github.com/moomoo-agency/uni-wc-hub-app-client). You may also need this [WP plugin](https://github.com/moomoo-agency/uni-orders-app-api-wp-plugin).

The information flow looks like this:

![the information flow](https://moomoo.agency/wp-content/uploads/2018/07/uni-wc-hub-app-scheme.jpg)

## How-to use

* `npm run start` - Start Node.js derver.

## Configuration

There are two main configuration files.

### sites.js

Locate 'sites.js' file and replace ids as well as add urls, usernames and passwords for your sites. This data is used to authenticate and obtain JWT token on targeted sites. Users which usernames and paswords are used must have proper roles in order to access the information. The original data looks like this:

```javascript
const sitesCfg =
    [
        {
            _id:      'printing',
            url:      '',
            username: '',
            password: '',
            token:    '',
            exp:      ''
        },
        {
            _id:      'furniture',
            url:      '',
            username: '',
            password: '',
            token:    '',
            exp:      ''
        }
    ];
```

Values like "furniture" and "printing" are unique ids of sites. You may choose any, but keep them synced with those you probably configured in the [client-side app](https://github.com/moomoo-agency/uni-wc-hub-app-client)

### clients.js

Locate 'clients.js' file and create your own users with their unique credentials. You may ad das many clients as you like. The credentials are used for login in the client apps. The original data looks like this:

```javascript
const clientsCfg =
          [
              {
                  _id:  'jack@black-pearl.ship',
                  name: 'Jack Sparrow',
                  pass: '12345',
                  token: ''
              },
              {
                  _id:  'homer@springfield.in',
                  name: 'Homer Simpson',
                  pass: '67890',
                  token: ''
              }
          ];
```

## Routes

Endpoint: `/`

Method: `GET`

Description: Homepage.

---

Endpoint: `/api/auth`

Method: `POST`

Data: 

```JSON
{
    "username": "",
    "password": ""
}
```

Description: Authenticating for client applications.

Returns a token `string` or auth error.

---

Endpoint: `/api/request-sales`

Method: `POST`

Headers: `Authorization <token>`

Data: 

```JSON
{
    "date_min": "",
    "date_max": ""
}
```

Description: Authenticating for client applications.

Returns an array with a single JSON object or JSON error object.

---