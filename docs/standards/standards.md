UI Standards 
Across all pages / the whole app - We should have a uniform UI standard that doesn't change ideally the header, footer and fontface should be the same and consistent across the application.
Buttons should be clearly colour coded and easy to understand at first glance for the user to understand, Red buttons for Deletion and danger actions
The UI should only show and display information that the user needs to see to interact with the application for example the amount of current cards they have in their deck, the shuffle button, changing the set amount of deck card, the colored cards with their different readings and meanings 
All other information such as the total amount of cards that the user can access in the application should be abstracted and hidden away from the user - Let's focus on the minimum amount of details that the user needs to view
Test Standards
Tests should be in relevant folder structure - for example UI Test should be in a folder called ui-tests, a document should contain information on the different test types being performed - eg. unit tests, e2e tests, 
Tests should cover various scenarios from successful and correct inputs such as pressing a button to shuffle a card and a new card appears, card displaying correctly, if the user inputs a card limit, then only show the card limit.
Validation messages should be cover and tested for features where user input can be provided such as increasing and decreasing the card limit
There must always be at least 1-5 cards in a deck, a deck with 0 cards cannot be set up if the user tries to set up a card with 0 decks then a validation message should be provided!
All Tests should past before a feature branch can be merged into master branch
Folder Structure Standards 
All Folders for Mono Repo should be labelled cleared and easy to understand on first glance for other programmers!
Code, Tests, Documentation should be seperated into different folders, labeled appropriately! The documentation folder shall be labelled as docs, test folder should be called test. 
Tests should be in relevant folder structure - for example UI Test should be in a folder called ui-tests, a document should contain information on the different test types being performed - eg. unit tests, e2e tests
Other Standards - (Categorize for later!)
For working on features - please work on a seperate branch and not on the main branch! Only merge the feature once it has been completed, properly tested, all tests pass before merging feature branches by creating a pull request first for code changes to be reviewed by me or someone else looking at the code before any form of merging can happen!
For commits please label them using the following format: Commit Title: Title of the Feature, A brief description of the feature that was worked on. - Actually let me speak with Hong about this one because I'm not too sure how much detail I should be be writing about commiting and making branches and pull request! 
For working on features - always branch off main first after reading the ticket and understanding what the task is. If the ticket requires more detail or needs further clarifying please respond with question!
Create a branch with an apporiate name for example feature/card-shuffle or feature/user-set-card-limit, work on said feature, make sure that the feature is properly implemented, add functional tests around the feature, make sure that new code added doesn't break old code / old tests before creating a commit to be merge into main with approval!