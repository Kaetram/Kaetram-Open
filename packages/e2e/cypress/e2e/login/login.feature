Feature: Login

    Rule: You need to enter correct account details

        Example: Nothing entered in login form
            Given I go to the login page
            When I click on the login button
            Then I see the login error "Please enter a username."

        Example: Only username entered
            Given I go to the login page
            And I fill in the "username" field with "test"
            When I click on the login button
            Then I see the login error "Please enter a password."

        Example: Incorrect account details
            Given I go to the login page
            And I fill in the "username" field with "test"
            And I fill in the "password" field with "test"
            When I click on the login button
            Then I see the login error "You have entered the wrong username or password."
