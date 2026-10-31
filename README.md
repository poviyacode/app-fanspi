<<<<<<< HEAD

# Appfanspi18

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## instalacion

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
ng generate environments
ng add @angular/pwa
npm install --save @fortawesome/fontawesome-free
npm install @ngx-translate/core @ngx-translate/http-loader
npm install socket.io-client@^4.7.5
npm install @angular/service-worker --save
npm i ngx-paypal

## en angular.json

"assets": [
{
"glob": "**/*",
"input": "public",
"output": "./public"
}
],
"styles": [
"src/styles.scss",
"node_modules/@fortawesome/fontawesome-free/css/all.min.css"
],
"scripts": [
"node_modules/@fortawesome/fontawesome-free/js/all.min.js"
],
"allowedCommonJsDependencies": [
"debug",
"xmlhttprequest-ssl"
],
....
"budgets": [
{
"type": "initial",
"maximumWarning": "4MB",
"maximumError": "5MB"
},
...
]

## en tsconfig.json

"paths": {
"@core/_":["./src/app/core/_"],
"@directive/_":["./src/app/directive/_"],
"@guards/_":["./src/app/guards/_"],
"@interfaces/_":["./src/app/interfaces/_"],
"@library/_":["./src/app/library/_"],
"@layout/_":["./src/app/layout/_"],
"@pipes/_":["./src/app/pipes/_"],
"@services/_":["./src/app/services/_"],
"@shared/_":["./src/app/shared/_"],
"@environments/_": ["./src/environments/_"],
},

    "strictPropertyInitialization": false,

## firebase

npm install firebase @angular/fire

## card paypal

Visa
Número de tarjeta: 4111 1111 1111 1111
Fecha de expiración: Cualquier fecha válida en el futuro (por ejemplo, 12/2028)
CVV: Cualquier número de tres dígitos (por ejemplo, 123)
MasterCard
Número de tarjeta: 5555 5555 5555 4444
Fecha de expiración: Cualquier fecha válida en el futuro (por ejemplo, 12/2028)
CVV: Cualquier número de tres dígitos (por ejemplo, 123)
American Express
Número de tarjeta: 3782 822463 10005
Fecha de expiración: Cualquier fecha válida en el futuro (por ejemplo, 12/2028)
CVV: Cualquier número de cuatro dígitos (por ejemplo, 1234)
Discover
Número de tarjeta: 6011 1111 1111 1117
Fecha de expiración: Cualquier fecha válida en el futuro (por ejemplo, 12/2028)
CVV: Cualquier número de tres dígitos (por ejemplo, 123)

Stripe:
ok :: 4242 4242 4242 4242
fail :: 4000 0000 0000 0341

