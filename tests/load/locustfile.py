from locust import HttpUser, task, between

class ParkNexUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def fetch_zones(self):
        self.client.get("/api/zones")

    @task(2)
    def fetch_vehicles(self):
        self.client.get("/api/vehicles?email=student@college.edu")

    @task(1)
    def fetch_my_pass(self):
        self.client.get("/api/passes/my-pass?email=student@college.edu")
