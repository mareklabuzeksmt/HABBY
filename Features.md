Tags in brackets bellow refer to groups of features in **[BDD spec](https://github.com/mareklabuzeksmt/HABBY/blob/master/BDD_features)**

* [Logging in/off] HABBY notes when member goes on/off in Slack. Needed for further features.

* [Checking in] HABBY remembers when member checks in

* [Reminder about checking in] When somebody logs in to Slack and is not checking in within say 15 mins (configurable), personal message from HABBY reminds them to do that. Answer to the bot, will publish status to status.

  > IDEA: when member is reminded and answers but meanwhile checked in, HABBY can ask about republishing anyway

* [Checking out] HABBY recognizes [bye-bye phrases](bye-bye-phrases) and remembers when member is checking out

  > IDEA: BRB handling

  > IDEA: members can add their phrases for checking out / BRB

  > IDEA: admin can inform HABBY that last member's message was about checking out / BRB, with double effect: checking out and adding new phrase

  > IDEA: last message in the day on status channel can be assumed as check out, worth acknowledging with admin/owner

  > IDEA: * [Holidays] Members can notify about holidays (also each other?)

* [Personal time report] Member [asks](https://github.com/mareklabuzeksmt/HABBY/blob/master/personal-report) HABBY about this/last week/month personal time report.

* [Admin time report] Admin [asks](https://github.com/mareklabuzeksmt/HABBY/blob/master/team-report) HABBY about team time report.
