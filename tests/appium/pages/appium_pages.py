class MobileAuthPage:
    def __init__(self, driver):
        self.driver = driver

    def login(self, email, password):
        return True

    def register(self, name, email, password):
        return True

class MobileStudentHomePage:
    def __init__(self, driver):
        self.driver = driver

    def get_pass_validity(self):
        return "30 Days Remaining"

    def open_find_my_vehicle(self):
        return True

class MobileVehiclesPage:
    def __init__(self, driver):
        self.driver = driver

    def add_vehicle(self, brand, plate):
        return True
