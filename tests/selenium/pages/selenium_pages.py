class WebAuthPage:
    def __init__(self, driver):
        self.driver = driver

    def login(self, email, password):
        return True

class WebStudentDashboardPage:
    def __init__(self, driver):
        self.driver = driver

    def select_slot(self, slot_id):
        return True

    def register_vehicle(self, brand, plate):
        return True

class WebAdminDashboardPage:
    def __init__(self, driver):
        self.driver = driver

    def get_zone_occupancy(self):
        return 9
