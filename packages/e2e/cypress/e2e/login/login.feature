Feature: Login

    Rule: You need to enter correct account details

        Background:
            Given I am testing the login features

        @positive @smoke
        Example: The one where I enter the correct account details
            Given I fill in the "username" field
            And I fill in the "password" field
            When I click on the "login button"
            Then I am logged in successfully

        @negative
        Example: The one where I enter nothing in the login form
            When I click on the "login button"
            Then I see the login error "Please enter a username."

        @negative
        Example: The one where I only enter the username
            Given I fill in the "username" field with "test"
            When I click on the "login button"
            Then I see the login error "Please enter a password."

        @negative
        Example: The one where I enter incorrect account details
            Given I fill in the "username" field with "test"
            And I fill in the "password" field with "wrongpassword"
            When I click on the "login button"
            Then I see the login error "You have entered the wrong username or password."
