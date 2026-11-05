# Postman API tests

1. Start the backend with a dedicated test MongoDB database and a valid `JWT_SECRET`.
2. Import `Electronic-Shop-Management-System.postman_collection.json` and `Local.postman_environment.json` into Postman.
3. Select **Electronic Shop - Local** and run the collection in order.

The collection checks the `/health` and root health endpoints, public product listing/detail, registration and login, current-user authentication, user orders and wishlist, and admin access control. `/health` reports HTTP 503 when MongoDB is disconnected. The collection generates a new user email on each run and stores the returned token for authenticated requests. Product detail is skipped when the database has no products.

Registration creates a persistent user in the configured database. Use a disposable test database; do not run the collection against production data.
