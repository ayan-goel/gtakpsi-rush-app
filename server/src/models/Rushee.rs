use bson::DateTime;
use serde::{Deserialize, Serialize};

use super::{misc::RushNight, pis::{PISSignup, PISTimeslot}};

#[derive(Debug, Serialize, Deserialize)]
pub struct RusheeEdit {
    pub field: String,
    pub new_value: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Rating {
    pub name: String,
    pub value: f32
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StrippedRushee {
    pub name: String,
    pub gtid: String,
    pub major: String,
    pub ratings: Vec<Rating>,
    pub image_url: String,
    pub class: String,
    pub email: String,
    pub pronouns: String,
    pub attendance: Vec<RushNight>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PisResponse {
    pub question: String,
    pub answer: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Comment {
    pub brother_id: String,
    pub brother_name: String,
    pub comment: String,
    pub ratings: Vec<Rating>,
    pub night: RushNight,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IncomingComment {
    pub brother_id: String,
    pub brother_name: String,
    pub comment: String,
    pub ratings: Vec<Rating>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IncomingRushee {
    pub first_name: String,
    pub last_name: String,
    pub housing: String,
    pub phone_number: String,
    pub email: String,
    pub gtid: String,
    pub major: String,
    pub class: String,
    pub pronouns: String,
    pub image_url: String,
    pub exposure: String,
    pub pis_meeting_id: String,
    pub pis_timeslot: String,
    pub pis_link: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RusheeModel {
    pub first_name: String,
    pub last_name: String,
    pub housing: String,
    pub phone_number: String,
    pub email: String,
    pub gtid: String,
    pub major: String,
    pub class: String, 
    pub pronouns: String,
    pub image_url: String,
    pub exposure: String,
    pub pis_meeting_id: String,
    pub pis_timeslot: DateTime,
    pub pis_link: String,
    pub cloud: String,
    pub pis: Vec<PisResponse>,
    pub comments: Vec<Comment>,
    pub attendance: Vec<RushNight>,
    pub ratings: Vec<Rating>,
    pub access_code: String,
    pub pis_signup: PISSignup,
}
