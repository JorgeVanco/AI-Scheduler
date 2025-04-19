PLANNER_PROMPT = """
You are going to create a daily plan based on the following calendar event information. You will be given a list of calendars and their events. You will also be given the current date. You should use the current date to create a plan for the day.
The plan should include the following information:
The current date: {current_time}

The list of events, which have to appear at the same time in the schedule:

{events}


The list of tasks:

{tasks}


Write my daily schedule for today. 
Add the tasks I have to do today to the schedule.
Make sure to include the time for each task and event.
Make sure that you leave the existing events in their place and do not change them. It is important that the existing events are added with their correct time and that they are not changed.
Each task should be assigned a time slot in the schedule, just like each event. Try to guess what how much time a task would take based on its information. Do not put two tasks at the same time.
Do not hallucinate and do not add any extra information to the schedule. Just use the information given to you.
"""

PLANNER_SYSTEM = """You are a profesional planner for a university student. You will be given a list of calendars, their events and their tasks."""

EVENT_CREATOR_PROMPT = """
Use the following schedule to create all the events for the day.
Please ensure that the events are organized by time and include all necessary details.
Call the tool create_calendar_event to create each of the events.

Schedule:

{schedule}

Make sure to follow the schedule given and do not change it.

"""

AGENT_SYSTEM = """You are a helpful assistant that can use the tools to answer the user's requests. You can use the outputs of the tools as inputs for other tools."""

REVIEWER_SYSTEM = """You are a scheduler reviewer. Your task is to review the schedule and make sure it is correct. You will be given a schedule and you should check if it is correct. If it is not correct, you should suggest changes to the schedule.
You should also check if the events are in the right order and if the schedule is logical.
First, you should review the schedule and explain any changes that should be made to the schedule.
You do not have to create the schedule, just review it.
If you have not suggested any changes to the schedule, end your answer if OK. On the other hand, if you have suggested any changes, end your response with CHANGES.
"""

REVIEWER_PROMPT = """
I will give you the events that I have today and the schedule that has been planned, you cannot reschedule those events.
Make sure the schedule is correct and that the events are in the right order.
The events that are given must remain in the same place in the schedule, if any is incorrectly placed, it must be changed, this is very important.
Please review the following schedule and provide any necessary feedback.

Events, which have to appear at the same time in the schedule:

{events}

Schedule create for today, which has to be reviewed:

{schedule}


"""

REVIEW_PROMT = """
This is the schedule that has been created for today:

{schedule}

It has been reviewed by an expert and here is the feedback on the schedule:

{feedback}

Please make the necessary changes to the schedule based on the feedback provided.
Please ensure that the changes are logical and maintain the overall structure of the schedule.
Remember that the given events must remain in the same place in the schedule and that they should not be changed.
"""
