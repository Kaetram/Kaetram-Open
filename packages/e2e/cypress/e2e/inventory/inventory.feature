Feature: Inventory

    Background:
        Given I am testing the inventory features

    Rule: You can open the window

        @positive @smoke
        Example: The one where I click on the inventory button to open the menu
            When I click on the "inventory button"
            Then I see the "inventory window"

    Rule: You can drop an item

        @positive @smoke
        Example: The one where I drop an item successfully
            Given I click on the "inventory button"
            And I see that the "first inventory slot" contains 1 "apple"
            And I click on the "first inventory slot"
            And I click on the "drop command"
            Then I see that the "first inventory slot" is empty
