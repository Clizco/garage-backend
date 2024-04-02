
# Nexit

Nexit is a fork of [blud](https://github.com/Clizco/blud), it is a CRUD project but in SQL, which allows customers to be registered for a purchasing system, it has views made in ejs for a front end view.

This project includes technologies such as:

- express
- dotenv
- express
- path
- morgan
- cookieParser
- bcrypt


## API Reference

#### Get all customers

```http
  GET /users/customers/all
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Required**. Your API key |

#### Get a single customer data

```http
  GET /users/${email}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Required**. user email to get user data |


#### Create a new customer

```http
  POST /users/signup/
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `first_name`      | `varchar` | **Required**. first name of the customer |
| `last_name`       | `varchar` | **Required**. last name of the customer |
| `user_email`      | `varchar` | **Required**. email of the customer |
| `user_password`   | `varbinary` | **Required**. password of the customer |
| `user_phone`      | `int` | **Required**. phone of the customer |
| `birth_date`      | `date` | **Required**. birth date of the customer |

#### Delete a customer

```http
  Delete /users/delete/:email
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `user_email`      | `varchar` | **Required**. email is used to locate the user and delete them from the database |







## Deployment

To deploy this project run

```bash
  npm run dev
```


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`PORT`

`DATABASE_PASSWORD`


## Author

- [@Clizco](https://github.com/Clizco)


## Feedback

If you have any feedback, please contact me with my email.

## Roadmap

- Update Users

- Front-end view in React

