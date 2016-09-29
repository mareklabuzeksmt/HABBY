README.md

# Concept

## Inspiration
Working in geographically dispersed team creates additional challenge. Daily scrums usually involve some online video / chat tool, need special / extra room with equipment, setting up and collecting all people there. That can add to standard 15 minutes even next quarter and can hinder organizing stand-up in the time convenient for the team,  especially when members don't start work at the same time. All that causes daily scrums often catch developers in the middle of their best concentration time in the morning, break what they work, switch context to stand-up and after - switch again and get up to speed with work. 
- An hour of best time lost for development.
The way out could be asynchronous stand-ups. Dedicated channel on Slack is very well suited for this purpose.

## What it does
HABBY is to facilitate daily check-in – as soon as somebody logs in, they should answer "3 scrum questions" on a dedicated status channel. And before logging of, say bye-bye to the team. 
Additionally, that can serve also the purpose of time tracking, both personally ("I need to leave early, will catch up tomorrow" scenario) and for managers.

# Using
Follow installation manual: https://github.com/mareklabuzeksmt/HABBY/blob/master/HabbyInstallationManual.pdf
Once you are set up:
1. Invite all members of the team to status channel.
2. After starting work, each member checks in on status channel - answers 3 Scrum questions or whatever team agrees. There is no specific phrase, saying anything counts as check-in.
3. If a member does not check in during 15 minutes after becoming active on Slack, HABBY reminds them to check in.
4. Each member should say one of bye-bye phrases (https://github.com/mareklabuzeksmt/HABBY/blob/master/bye-bye-phrases) before leaving the work.
As a bonus, you can get time reports - say one of report phrases in DM to HABBY (https://github.com/mareklabuzeksmt/HABBY/blob/master/personal-report or https://github.com/mareklabuzeksmt/HABBY/blob/master/team-report).

# NPM
npm install git+https://github.com/dherault/serverless-offline.git/#serverless_v1 --save

