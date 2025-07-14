use axum::extract::Query;
use axum::{
    extract::Path,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use bson::DateTime;
use futures::stream::StreamExt;
use lambda_http::{run, Error};
use mongodb::{
    bson::{doc, to_bson, Document},
    Client, Collection,
};
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashSet;
use std::env::set_var;

use super::db;
use crate::middlewares::timeHelpers::same_day;
use crate::middlewares::valid::check_valid_comment;
use crate::middlewares::{attendance, pis, timeHelpers, valid};
use crate::models::misc::RushNight;
use crate::models::pis::PISSignup;
use crate::models::Rushee::{
    Comment, IncomingComment, IncomingRushee, PisResponse, Rating, RusheeEdit, RusheeModel,
    StrippedRushee,
};

#[derive(Deserialize, Serialize)]
struct Params {
    first: Option<String>,
    second: Option<String>,
}

/**
 * Registers a new rushee
 */
pub async fn signup(Json(payload): Json<IncomingRushee>) -> Result<Json<Value>, StatusCode> {
    let collection: Collection<RusheeModel> = db::get_rushee_client().await;

    // convert incoming timeslot to a bson DateTime type
    let date_converstion = timeHelpers::string_to_bson_datetime(&payload.pis_timeslot.to_string());

    // TODO: verify all fields

    // verify valid email

    // verify valid phone number (10 digits)

    // verify email and that email does not already exist

    // verify gtid does not already exists
    let verify_attempt = valid::is_gtid_valid(&payload.gtid).await;

    match verify_attempt {
        Ok(verify_result) => {
            if !verify_result {
                return Ok(Json(json!({
                    "status": "error",
                    "message": "gtid either already exists or is not 9 digits"
                })));
            }
        }

        Err(err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "failed to verify gtid"
            })))
        }
    }

    // take PIS timeslot
    let take_timeslot_result = pis::take_pis_timeslot(date_converstion).await;

    match take_timeslot_result {
        Ok(_x) => {
            // do nothing
        }

        Err(err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": err.to_string()
            })))
        }
    }

    let access_code: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(15)
        .map(char::from)
        .collect();

    let new_rushee = RusheeModel {
        first_name: payload.first_name.to_string(),
        last_name: payload.last_name.to_string(),
        housing: payload.housing.to_string(),
        phone_number: payload.phone_number.to_string(),
        email: payload.email.to_string(),
        gtid: payload.gtid.to_string(),
        major: payload.major.to_string(),
        class: payload.class.to_string(),
        pronouns: payload.pronouns.to_string(),
        image_url: payload.image_url.to_string(),
        exposure: payload.exposure.to_string(),
        pis_meeting_id: payload.pis_meeting_id.to_string(),
        pis_timeslot: date_converstion,
        pis_link: payload.pis_link.to_string(),
        cloud: "none".to_string(),
        pis: Vec::<PisResponse>::new(),
        comments: Vec::<Comment>::new(),
        attendance: Vec::<RushNight>::new(),
        ratings: Vec::<Rating>::new(),
        access_code: access_code.clone(),
        pis_signup: PISSignup {
            time: date_converstion,
            rushee_first_name: payload.first_name.to_string(),
            rushee_last_name: payload.last_name.to_string(),
            rushee_gtid: payload.gtid.to_string(),
            first_brother_first_name: "none".to_string(),
            first_brother_last_name: "none".to_string(),
            second_brother_first_name: "none".to_string(),
            second_brother_last_name: "none".to_string(),
            third_brother_first_name: "none".to_string(),
            third_brother_last_name: "none".to_string(),
        },
    };

    let result = collection.insert_one(new_rushee).await;

    match result {
        Ok(_insert_result) => {
            return Ok(Json(json!({
                "status": "success",
                "payload": access_code,
            })))
        }

        Err(_err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "there was some error"
            })))
        }
    }
}

/**
 * gets all rushees in the following form: {"id", "name", "picture", "ratings" ...} (only the info needed for the homepage)
 * filters are passed in through the header
 */
pub async fn get_rushees() -> Result<Json<Value>, StatusCode> {
    let collection: Collection<RusheeModel> = db::get_rushee_client().await;

    let result = collection
        .find({
            doc! {}
        })
        .await;

    match result {
        Ok(mut cursor) => {
            // TODO: extract useful info only
            let mut rushees = Vec::<StrippedRushee>::new();

            while let Some(rushee) = cursor.next().await {
                match rushee {
                    Ok(doc) => rushees.push(StrippedRushee {
                        name: format!("{} {}", doc.first_name, doc.last_name),
                        class: doc.class,
                        gtid: doc.gtid,
                        major: doc.major,
                        ratings: doc.ratings,
                        image_url: doc.image_url,
                        email: doc.email,
                        pronouns: doc.pronouns,
                        attendance: doc.attendance,
                    }),
                    Err(err) => {
                        println!("{}", err.to_string());
                        return Ok(Json(json!({
                            "status": "error",
                            "message": "there was an error pushing the stripped rushee to the array"
                        })));
                    }
                }
            }

            Ok(Json(json!({
                "status": "success",
                "payload": rushees
            })))
        }

        Err(err) => Ok(Json(json!({
            "stauts": "error",
            "message": "some network error occurred"
        }))),
    }
}

// returns comments, ratings, etc..
pub async fn get_rushee(Path(id): Path<String>) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let result = connection.find_one(doc! {"gtid": id.clone()}).await;

    match result {
        Ok(insert_result) => match insert_result {
            Some(rushee) => Ok(Json(
                (json!({
                    "status": "success",
                    "payload": rushee
                })),
            )),

            None => Ok(Json(json!({
                "status": "error",
                "message": format!("Rushee with GTID {} does not exist", id)
            }))),
        },

        Err(err) => Ok(Json(json!({
            "status": "error",
            "message": "some network error occurred when fetching the rushee"
        }))),
    }
}

/**
 * Post a new comment to some rushee
 * Uses timestamp to record date
 */
pub async fn post_comment(
    Path(id): Path<String>,
    Json(payload): Json<IncomingComment>,
) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;
    let fetch_rush_nights = attendance::get_rush_nights().await;

    match fetch_rush_nights {
        Ok(rush_nights) => {
            for rush_night in rush_nights.iter() {
                if true {//same_day(&rush_night.time, &bson::DateTime::now()) {
                    // found rush night
                    let attempt_bson_night = to_bson(&rush_night);
                    let mut bson_night;

                    match attempt_bson_night {
                        Ok(x) => {
                            bson_night = x;
                        }

                        Err(_err) => {
                            return Ok(Json(json!({
                                "status": "error",
                                "message": "some issue occurred when serializing the rush night"
                            })))
                        }
                    }

                    let my_rush_night = RushNight {
                        name: rush_night.name.clone(),
                        time: rush_night.time,
                    };

                    let new_comment = Comment {
                        brother_id: payload.brother_id.clone(),
                        brother_name: payload.brother_name.clone(),
                        comment: payload.comment.clone(),
                        ratings: payload.ratings.clone(),
                        night: my_rush_night.clone(),
                    };

                    // fetch the rushee
                    let get_rushee_result = connection.find_one(doc! {"gtid": id.clone()}).await;

                    match get_rushee_result {
                        Ok(rushee_option) => {
                            let mut rushee;

                            match rushee_option {
                                Some(x) => {
                                    rushee = x;
                                }
                                None => {
                                    return Ok(Json(json!({
                                        "status": "error",
                                        "message": "some error occurred"
                                    })))
                                }
                            }

                            // check if brother has already made a comment
                            let is_valid = check_valid_comment(
                                &payload.brother_name,
                                &my_rush_night,
                                &rushee.comments,
                            )
                            .await;

                            match is_valid {
                                Ok(_result) => {
                                    // do nothing
                                }

                                Err(_err) => {
                                    return Ok(Json(json!({
                                        "status": "error",
                                        "message": "you have already made a comment for this rush night"
                                    })))
                                }
                            }

                            // update ratings
                            for rating in payload.ratings.iter() {
                                // find the value...

                                let search_rating = rushee
                                    .ratings
                                    .iter()
                                    .find(|r: &&Rating| rating.name == r.name);

                                match search_rating {
                                    Some(y) => {
                                        // push the new value
                                        let new_value = ((y.value
                                            * (rushee.comments.len() as f32))
                                            + rating.value)
                                            / ((rushee.comments.len() as f32) + 1.0);

                                        let filter = doc! {
                                            "gtid": id.clone(),
                                            "ratings.name": rating.name.clone(),
                                        };

                                        // Build the update document
                                        let update = doc! {
                                            "$set": {
                                                "ratings.$.value": new_value,
                                            },
                                        };

                                        let update_result_try =
                                            connection.update_one(filter, update).await;

                                        match update_result_try {
                                            Ok(_update_result) => {
                                                // do nothing
                                            }
                                            Err(_err) => {
                                                return Ok(Json(json!({
                                                    "status": "error",
                                                    "message": "there was an error updating the rushee's global ratings"
                                                })))
                                            }
                                        }
                                    }
                                    None => {
                                        let mut rating_bson;
                                        let rating_bson_try = to_bson(&rating);

                                        match rating_bson_try {
                                            Ok(x) => {
                                                rating_bson = x;
                                            }
                                            Err(err) => {
                                                return Ok(Json(json!({
                                                    "status": "error",
                                                    "message": "couldn't make the pis response into a bson file"
                                                })))
                                            }
                                        }

                                        let filter = doc! {"gtid": id.clone()};
                                        let update = doc! {"$push" : {
                                            "ratings": rating_bson,
                                        }};

                                        let update_result_try =
                                            connection.update_one(filter, update).await;

                                        match update_result_try {
                                            Ok(_update_result) => {
                                                // do nothing
                                            }
                                            Err(_err) => {
                                                return Ok(Json(json!({
                                                    "status": "error",
                                                    "message": "there was an error updating the rushee's global ratings"
                                                })))
                                            }
                                        }
                                    }
                                }
                            }

                            let mut bson_comment;
                            let mut bson_comment_try = to_bson(&new_comment);

                            match bson_comment_try {
                                Ok(x) => {
                                    bson_comment = x;
                                }
                                Err(err) => {
                                    return Ok(Json(json!({
                                        "status": "error",
                                        "message": "some error occurred"
                                    })))
                                }
                            }

                            let filter = doc! {"gtid": id};
                            let update = doc! {"$push": {
                                "comments": bson_comment,
                            }};

                            let result = connection.update_one(filter, update).await;

                            match result {
                                Ok(_update_result) => {
                                    return Ok(Json(json!({
                                        "status": "success",
                                        "message": "successfully updated rushee"
                                    })))
                                }

                                Err(_err) => {
                                    return Ok(Json(json!({
                                        "status": "error",
                                        "message": "something wrong occurred"
                                    })))
                                }
                            }
                        }

                        Err(_err) => {
                            return Ok(Json(json!({
                                "status": "error",
                                "message": "something wrong occurred"
                            })))
                        }
                    }
                }
            }

            return Ok(Json(json!({
                "status": "error",
                "message": "couldn't match a rush night"
            })));
        }

        Err(_err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "there was some error while matching the rush night"
            })))
        }
    }
}

/**
 * Post a Rushee's PIS
 */
pub async fn post_pis(
    Path(id): Path<String>,
    Json(payload): Json<Vec<PisResponse>>,
) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let mut filter;
    let mut update;

    // null out current entries
    filter = doc! {"gtid": id.clone()};
    update = doc! {"$set": doc! { "pis" : [] }};

    let clear_out_result = connection.update_one(filter, update).await;

    match clear_out_result {

        Ok(_clear_out) => {

        }

        Err(_err) => {
            return Ok(Json(json!({
                "status": "success",
                "message": "There was an error clearing out the current PIS responses"
            })))
        }

    }

    let mut pis_bson_try;
    let mut pis_bson;

    for response in payload.iter() {
        // push the pis response
        filter = doc! {"gtid": id.clone()};

        pis_bson_try = to_bson(&response);

        match pis_bson_try {
            Ok(x) => {
                pis_bson = x;
            }
            Err(err) => {
                return Ok(Json(json!({
                    "status": "error",
                    "message": "couldn't make the pis response into a bson file"
                })))
            }
        }

        update = doc! {
            "$push" : {
                "pis": pis_bson,
            }
        };

        let result = connection.update_one(filter, update).await;

        match result {
            Ok(update_result) => {
                // do nothing
            }

            Err(err) => {
                return Ok(Json(json!({
                    "status": "error",
                    "message": "failed to push a pis response"
                })))
            }
        }
    }

    Ok(Json(json!({
        "status": "success",
        "message": "succesfully stored rushee's pis"
    })))
}

/**
 * Uses current time to stamp attendance
 */
pub async fn update_attendance(Path(id): Path<String>) -> Result<Json<Value>, StatusCode> {
    let fetch_rush_nights = attendance::get_rush_nights().await;
    let connection = db::get_rushee_client().await;

    match fetch_rush_nights {
        Ok(rush_nights) => {
            for candidate_night in rush_nights.iter() {
                if same_day(&candidate_night.time, &bson::DateTime::now()) {
                    // found rush night

                    let attempt_bson_night = to_bson(&candidate_night);
                    let mut bson_night;

                    match attempt_bson_night {
                        Ok(x) => {
                            bson_night = x;
                        }

                        Err(_err) => {
                            return Ok(Json(json!({
                                "status": "error",
                                "message": "some issue occurred when serializing the rush night"
                            })))
                        }
                    }

                    let filter = doc! {"gtid": id.clone()};
                    let update = doc! {"$push": {
                        "attendance": bson_night,
                    }};

                    let result = connection.update_one(filter, update).await;

                    match result {
                        Ok(_update_result) => {
                            return Ok(Json(json!({
                                "status": "success",
                                "message": "updated rushee attendance"
                            })))
                        }

                        Err(_err) => {
                            return Ok(Json(json!({
                                "status": "error",
                                "message": "couldn't update rushee attendance"
                            })))
                        }
                    }
                }
            }

            return Ok(Json(json!({
                "status": "error",
                "message": "rush night does not exist"
            })));
        }

        Err(err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "some error occurred"
            })))
        }
    }
}

/**
 * Update the cloud the rushee is in
 */
pub async fn update_cloud(
    Path(id): Path<String>,
    Json(payload): Json<String>,
) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let filter = doc! {"_id": id};
    let update = doc! {"$set": doc! {"cloud": payload}};

    let result = connection.update_one(filter, update).await;

    match result {
        Ok(update_result) => Ok(Json(json!({
            "status": "success",
            "message": "sucessfully updated rushee cloud"
        }))),

        Err(err) => Ok(Json(json!({
            "status": "error",
            "message": "did not update cloud"
        }))),
    }
}

/**
 * Update rushee (edit rushee's attributes)
 */
pub async fn update_rushee(
    Path(id): Path<String>,
    Json(payload): Json<Vec<RusheeEdit>>,
) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let mut filter: Document;
    let mut update: Document;

    for edit in payload.iter() {
        if valid::get_pis_signup_breaking_changes().contains(&edit.field) {
            filter = doc! {"gtid": id.clone()};
            update = doc! {
                "$set": {
                    edit.field.clone(): edit.new_value.clone(),
                    format!("pis_signup.rushee_{}", edit.field.clone()): edit.new_value.clone()
                }
            };

            let result = connection.update_one(filter, update).await;

            match result {
                Ok(_update_reult) => {
                    // do nothing
                }

                Err(err) => {
                    return Ok(Json(json!({
                        "status": "error",
                        "message": err.to_string()
                    })))
                }
            }

        } else if valid::get_rushee_edit_fields().contains(&edit.field) {
            filter = doc! {"gtid": id.clone()};
            update = doc! {"$set": doc! { edit.field.clone(): edit.new_value.clone() }};

            let result = connection.update_one(filter, update).await;

            match result {
                Ok(_update_reult) => {
                    // do nothing
                }

                Err(_err) => {
                    return Ok(Json(json!({
                        "status": "error",
                        "message": "Some error occurred when updating the rushee"
                    })))
                }
            }
        } else {
            return Ok(Json(json!({
                "status": "error",
                "message": format!("Invalid rushee field passed in: {}", edit.field)
            })));
        }
    }

    Ok(Json(json!({
        "status": "success",
        "message": "Successfully updated all fields"
    })))
}

/**
 * Reschdule Rushee PIS
 * accepts a string in the BSON DateTime format
 */
pub async fn reschedule_pis(
    Path(id): Path<String>,
    Json(payload): Json<String>,
) -> Result<Json<Value>, StatusCode> {
    let time = timeHelpers::string_to_bson_datetime(&payload);
    let connection = db::get_rushee_client().await;

    let vacate_result = pis::vacate_pis_timeslot(time).await;

    match vacate_result {
        Ok(_x) => {
            // do nothing
        }

        Err(err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": err.to_string()
            })))
        }
    }

    let take_result = pis::take_pis_timeslot(time).await;

    match take_result {
        Ok(_y) => {
            // do nothing
        }

        Err(err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": err.to_string()
            })))
        }
    }

    let query = doc! {"gtid": "id"};
    let update = doc! {"$set": doc! {"pis_timeslot": time }};

    let update_result = connection.update_one(query, update).await;

    match update_result {
        Ok(_z) => {
            return Ok(Json(json!({
                "status": "success",
                "message": "successfully rescheduled pis"
            })))
        }

        Err(_err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "failed to update rushee"
            })))
        }
    }
}

pub async fn delete_comment(
    Path(id): Path<String>,
    Json(payload): Json<Comment>,
) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let filter = doc! {"gtid": id};

    // attempt to
    let mut bson_night: bson::Bson;
    let bson_night_attempt = to_bson(&payload.night);

    match bson_night_attempt {
        Ok(x) => {
            bson_night = x;
        }

        Err(_error) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "there was an error bsonifying the night"
            })))
        }
    }

    let update = doc! {
        "$pull": {
            "comments": {
                "brother_name": &payload.brother_name,
                "night": bson_night
            }
        }
    };
    let update_result = connection.update_one(filter, update).await;

    match update_result {
        Ok(_result) => {
            return Ok(Json(json!({
                "status": "success",
                "message": "successfully deleted comment"
            })))
        }

        Err(_err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "couldn't push the update to the database"
            })))
        }
    }
}

pub async fn edit_comment(
    Path(id): Path<String>,
    Json(payload): Json<Comment>,
) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let mut bson_night: bson::Bson;
    let bson_night_attempt = to_bson(&payload.night);

    match bson_night_attempt {
        Ok(x) => {
            bson_night = x;
        }

        Err(_error) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "there was an error bsonifying the night"
            })))
        }
    }

    let filter = doc! {
        "gtid": id.clone(),
        "comments": {
            "$elemMatch": {
                "brother_name": payload.brother_name,
                "night": bson_night,
            }
        }
    };

    let update = doc! {
        "$set": {
            "comments.$.comment": payload.comment
        }
    };

    let edit_result = connection.update_one(filter, update).await;

    match edit_result {
        Ok(_edit) => {
            return Ok(Json(json!({
                "status": "success",
                "message": "updated comment successfully"
            })))
        }

        Err(_err) => {
            return Ok(Json(json!({
                "status": "error",
                "message": "there was an error pushing the update to the database"
            })))
        }
    }
}

pub async fn does_rushee_exist(Path(id): Path<String>) -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let result = connection.find_one(doc! {"gtid": id.clone()}).await;

    match result {
        Ok(insert_result) => match insert_result {
            Some(rushee) => Ok(Json(
                (json!({
                    "status": "error",
                    "message": format!("exists")
                })),
            )),

            None => Ok(Json(json!({
                "status": "success",
                "message": format!("Rushee with GTID {} does not exist", id)
            }))),
        },

        Err(err) => Ok(Json(json!({
            "status": "error",
            "message": "Some network error occurred when checking if the rushee exists or not"
        }))),
    }
}

pub async fn get_signup_timeslots() -> Result<Json<Value>, StatusCode> {
    let connection = db::get_rushee_client().await;

    let result = connection
        .find({
            doc! {}
        })
        .await;

    match result {
        Ok(mut cursor) => {
            // TODO: extract useful info only
            let mut rushees = Vec::<PISSignup>::new();

            while let Some(rushee) = cursor.next().await {
                match rushee {
                    Ok(doc) => rushees.push(doc.pis_signup),
                    Err(err) => {
                        println!("{}", err.to_string());
                        return Ok(Json(json!({
                            "status": "error",
                            "message": "there was an error pushing the stripped rushee to the array"
                        })));
                    }
                }
            }

            Ok(Json(json!({
                "status": "success",
                "payload": rushees
            })))
        }

        Err(err) => Ok(Json(json!({
            "stauts": "error",
            "message": "some network error occurred"
        }))),
    }
}
