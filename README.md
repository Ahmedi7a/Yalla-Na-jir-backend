# Express API - JWT Auth Back-End - Setup

## Setup

Open your Terminal application and navigate to your projects codespace directory:

## Cloning the Auth boilerplate

This lecture uses the [Express API JWT Auth Template](https://github.com/Dujota/express-api-jwt-auth-template.git) as starter code. The template includes code to authenticate users with JWT tokens.

Navigate to the [Express API JWT Auth Template](https://github.com/Dujota/express-api-jwt-auth-template.git) and clone the repository to your machine:

```bash
git clone https://github.com/Dujota/express-api-jwt-auth-template.git
```

Once we have the repository on our machines, we can change the name of the directory to `'express-api-hoot-back-end'`:

```bash
mv express-api-jwt-auth-template YOUR_APP_NAME
```

Next, `cd` into your renamed directory:

```bash
cd YOUR_APP_NAME
```

Finally, remove the existing `.git` information from this template:

```bash
rm -rf .git
```

> Removing the `.git` info is important as this is just a starter template provided by GA. You do not need the existing git history for this project.

## GitHub setup

To add this project to GitHub, initialize a new Git repository:

```bash
git init
git add .
git commit -m "init commit"
```

Make a new repository on [GitHub](https://github.com/) named `YOUR_APP_NAME`.

Link your local project to your remote GitHub repo:

```bash
git remote add origin https://github.com/<github-username>/YOUR_APP_NAME.git
git push origin main
```

> 🚨 Do not copy the above command. It will not work. Your GitHub username will replace `<github-username>` (including the `<` and `>`) in the URL above. Also replace `YOUR_APP_NAME` with your project name

Open the project's folder in your code editor:

```bash
code .
```

## Install dependencies

Next, you will want to install all of the packages listed in `package.json`

```bash
npm i
```

## Create your .gitignore

Run the following command in your terminal:

```bash
touch .gitignore
```

Once these files are created, add `.env` and `node_modules` to your `.gitignore` file. Doing so will prevent those files and directories from being tracked and we can be confident that any data we add there will not be pushed up to GitHub.

```text
.env
node_modules
```

## Create your .env

Run the following command in your terminal:

```bash
touch .env
```

Lastly, we want to add a `MONGODB_URI` and a `JWT_SECRET`.

Add the following secret keys to your application:

```text
MONGODB_URI=mongodb+srv://<username>:<password>@sei-w0kys.azure.mongodb.net/hoot?retryWrites=true
JWT_SECRET=supersecret
SALT_ROUNDS=10
```

> If you are unsure of where to obtain your MongoDB URI, please refer to the MongoDB Atlas Setup Lab.

Start the application with the following command:

```bash
npm run dev
```

Happy Coding!
