'''

A simple python script to safely and quickly setup the rush app.

Add info as needed into rush_nights.json and pis_timeslots.json

'''

from pymongo import MongoClient
from dotenv import load_dotenv
from tqdm import tqdm
from datetime import datetime

import json
import os
import requests
import boto3

# Restrict script from running between September 1st and September 12th
current_date = datetime.now()
if datetime(current_date.year, 9, 1) <= current_date <= datetime(current_date.year, 9, 12):
    print("This script cannot be run between September 1st and September 12th. [Spring 2025 Rush]")
    exit()

# Load environment variables from .env file
load_dotenv()

# setup .env variables [if you don't have the aws keys, you need to ask Ashwin or the current PM]
mongo_uri = "mongodb+srv://gtakpsisoftware:brznOWH0oPA9fT5N@gtakpsi.bf6r1.mongodb.net/"
api_url = os.getenv("API")
aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

# Connect to MongoDB
client = MongoClient(mongo_uri)

# Access a database
db = client["rush-app"]

# delete all rushees
print("Deleting all rushees...")
rushee_collection = db["rushees"]
rushee_collection.delete_many({})
print("Deleted all rushees")

# delete all rush nights
print("Deleting all rush nights...")
rush_night_collection = db["rush-nights"]
rush_night_collection.delete_many({})
print("Deleted all rush nights")

# delete all pis timeslots
print("Deleting all PIS timeslots...")
pis_timeslot_collection = db["pis-timeslots"]
pis_timeslot_collection.delete_many({})
print("Deleted all PIS timeslots.")

# delete all PIS questions
print("Deleting all PIS questions...")
pis_question_collection = db["pis-questions"]
pis_question_collection .delete_many({})
print("Deleted all PIS questions.")

print("Deleting all Rush App pictures...")

# delete all rushee pics from s3
bucket_name = "rush-app-pics"
s3 = boto3.client(  "s3",
                    aws_access_key_id=aws_access_key,
                    aws_secret_access_key=aws_secret_key
                )

try:
    # List all objects in the bucket
    response = s3.list_objects_v2(Bucket=bucket_name)

    if "Contents" in response:
        # Extract the object keys
        objects = [{"Key": obj["Key"]} for obj in response["Contents"]]

        # Delete all objects
        delete_response = s3.delete_objects(
            Bucket=bucket_name,
            Delete={"Objects": objects}
        )
    else:
        pass

except Exception as e:
    print(f"Error while deleting rush app pictures: {e}")

print("Deleted all rush app pictures.")

errors = []

# add pis timeslots
with open("pis_timeslots.json", "r") as file:
    data = json.load(file)

    for i in tqdm(range(len(data)), desc="Adding PIS Timeslots"):
        response = requests.post(api_url + "/admin/add_pis_timeslot", json=data[i])
        
        if response.status_code == 200:
            if response.json().get("status") == "error":
                errors.append(response.json().get("message"))
        else:
            errors.append(f"Some network error occurred while adding PIS Timeslot at {data[i]['time']}")


# add rush nights
with open("rush_nights.json", "r") as file:

    data = json.load(file)

    for i in tqdm(range(len(data)), desc="Adding Rush Nights"):
        response = requests.post(api_url + "/admin/add-rush-night", json=data[i])
        
        if response.status_code == 200:
            if response.json().get("status") == "error":
                errors.append(response.json().get("message"))
        else:
            errors.append(f"Some network error occurred while adding Rush Night {data[i]['name']}")

with open("pis_questions.json", "r") as file:

    data = json.load(file)

    for i in tqdm(range(len(data)), desc="Adding PIS Questions"):
        response = requests.post(api_url + "/admin/add_pis_question", json=data[i])
        
        if response.status_code == 200:
            if response.json().get("status") == "error":
                errors.append(response.json().get("message"))
        else:
            errors.append(f"Some network error occurred while adding PIS Question {data[i]['question']}")


if len(errors) > 0:

    print("There were some errors during the setup process:")

    for error in errors:
        print(error)

else:
    print("Rush App Set Up Complete!")