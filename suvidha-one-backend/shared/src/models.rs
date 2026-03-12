use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::postgres::{PgTypeInfo, PgHasArrayType, PgArgumentBuffer};
use sqlx::{Encode, Decode, Type};
use std::str::FromStr;
use std::fmt;
use sqlx::encode::IsNull;

// SQLx macros for enum database conversion
macro_rules! impl_pg_enum {
    ($enum_name:ident) => {
        impl Type<sqlx::Postgres> for $enum_name {
            fn type_info() -> PgTypeInfo {
                PgTypeInfo::with_name(stringify!($enum_name))
            }
        }

        impl PgHasArrayType for $enum_name {
            fn array_type_info() -> PgTypeInfo {
                PgTypeInfo::with_name(concat!(stringify!($enum_name), "[]"))
            }
        }

        impl<'r> Decode<'r, sqlx::Postgres> for $enum_name {
            fn decode(value: sqlx::postgres::PgValueRef<'r>) -> Result<Self, Box<dyn std::error::Error + 'static + Send + Sync>> {
                let s = <&str as Decode<sqlx::Postgres>>::decode(value)?;
                $enum_name::from_str(s).map_err(|e| Box::<dyn std::error::Error + Send + Sync>::from(e))
            }
        }

        impl<'q> Encode<'q, sqlx::Postgres> for $enum_name {
            fn encode_by_ref(&self, buf: &mut PgArgumentBuffer) -> IsNull {
                <&str as Encode<sqlx::Postgres>>::encode(&self.to_string(), buf)
            }
        }
    };
}

// Macro to implement Display and FromStr for enums
macro_rules! impl_display_fromstr {
    ($enum_name:ident, $($variant:ident),+) => {
        impl fmt::Display for $enum_name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                match self {
                    $(
                        $enum_name::$variant => write!(f, "{}", stringify!($variant)),
                    )+
                }
            }
        }

        impl FromStr for $enum_name {
            type Err = String;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s.to_lowercase().as_str() {
                    $(
                        s if s == stringify!($variant).to_lowercase() => Ok($enum_name::$variant),
                    )+
                    _ => Err(format!("Invalid {} value: {}", stringify!($enum_name), s)),
                }
            }
        }
    };
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub user_id: Uuid,
    pub aadhaar_id_hash: Option<String>,
    pub mobile_hash: Option<String>,
    pub full_name: Option<String>,
    pub state_code: Option<String>,
    pub preferred_language: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub aadhaar_id_hash: Option<String>,
    pub mobile_hash: Option<String>,
    pub full_name: String,
    pub state_code: String,
    pub preferred_language: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub session_id: Uuid,
    pub user_id: Uuid,
    pub kiosk_id: String,
    pub auth_method: AuthMethod,
    pub created_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub idle_timeout: u64,
    pub hard_timeout: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuthMethod {
    Otp,
    Aadhaar,
    Qr,
}

impl_pg_enum!(AuthMethod);
impl_display_fromstr!(AuthMethod, Otp, Aadhaar, Qr);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillDetails {
    pub bill_id: Uuid,
    pub consumer_id: String,
    pub amount: Decimal,
    pub due_date: NaiveDate,
    pub department: Department,
    pub status: BillStatus,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Department {
    Electricity,
    Water,
    Gas,
    Municipal,
}

impl_pg_enum!(Department);
impl_display_fromstr!(Department, Electricity, Water, Gas, Municipal);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BillStatus {
    Pending,
    Paid,
    Overdue,
}

impl_pg_enum!(BillStatus);
impl_display_fromstr!(BillStatus, Pending, Paid, Overdue);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRecord {
    pub payment_id: Uuid,
    pub user_id: Uuid,
    pub amount: Decimal,
    pub tx_ref: String,
    pub status: PaymentStatus,
    pub method: PaymentMethod,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentStatus {
    Pending,
    Success,
    Failed,
}

impl_pg_enum!(PaymentStatus);
impl_display_fromstr!(PaymentStatus, Pending, Success, Failed);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentMethod {
    Upi,
    Card,
    Bbps,
}

impl_pg_enum!(PaymentMethod);
impl_display_fromstr!(PaymentMethod, Upi, Card, Bbps);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentReceipt {
    pub transaction_id: Uuid,
    pub user_id: Uuid,
    pub bill_ids: Vec<Uuid>,
    pub amount: Decimal,
    pub tx_ref: String,
    pub status: PaymentStatus,
    pub method: PaymentMethod,
    pub paid_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Grievance {
    pub grievance_id: Uuid,
    pub user_id: Uuid,
    pub category: GrievanceCategory,
    pub department: Department,
    pub subject: String,
    pub description: String,
    pub status: GrievanceStatus,
    pub priority: Priority,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GrievanceCategory {
    Billing,
    Service,
    Infrastructure,
    Other,
}

impl_pg_enum!(GrievanceCategory);
impl_display_fromstr!(GrievanceCategory, Billing, Service, Infrastructure, Other);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GrievanceStatus {
    Open,
    InProgress,
    Resolved,
    Closed,
}

impl_pg_enum!(GrievanceStatus);
impl_display_fromstr!(GrievanceStatus, Open, InProgress, Resolved, Closed);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

impl_pg_enum!(Priority);
impl_display_fromstr!(Priority, Low, Medium, High, Critical);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub document_id: Uuid,
    pub user_id: Uuid,
    pub doc_type: DocumentType,
    pub name: String,
    pub digilocker_id: Option<String>,
    pub status: DocumentStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentType {
    BirthCertificate,
    CasteCertificate,
    IncomeCertificate,
    ResidenceCertificate,
    AadhaarCard,
    VoterId,
}

impl_pg_enum!(DocumentType);
impl_display_fromstr!(DocumentType, BirthCertificate, CasteCertificate, IncomeCertificate, ResidenceCertificate, AadhaarCard, VoterId);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Pending,
    Applied,
    Issued,
    Rejected,
}

impl_pg_enum!(DocumentStatus);
impl_display_fromstr!(DocumentStatus, Pending, Applied, Issued, Rejected);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Kiosk {
    pub kiosk_id: String,
    pub state_code: String,
    pub district_code: String,
    pub location: String,
    pub status: KioskStatus,
    pub last_heartbeat: DateTime<Utc>,
    pub config_version: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum KioskStatus {
    Active,
    Inactive,
    Maintenance,
    Offline,
}

impl_pg_enum!(KioskStatus);
impl_display_fromstr!(KioskStatus, Active, Inactive, Maintenance, Offline);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub notification_id: Uuid,
    pub user_id: Uuid,
    pub notification_type: NotificationType,
    pub channel: NotificationChannel,
    pub recipient: String,
    pub message: String,
    pub status: NotificationStatus,
    pub sent_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationType {
    Otp,
    PaymentReceipt,
    BillReminder,
    GrievanceUpdate,
    DocumentReady,
}

impl_pg_enum!(NotificationType);
impl_display_fromstr!(NotificationType, Otp, PaymentReceipt, BillReminder, GrievanceUpdate, DocumentReady);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationChannel {
    Sms,
    WhatsApp,
    Push,
    Email,
}

impl_pg_enum!(NotificationChannel);
impl_display_fromstr!(NotificationChannel, Sms, WhatsApp, Push, Email);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationStatus {
    Pending,
    Sent,
    Failed,
}

impl_pg_enum!(NotificationStatus);
impl_display_fromstr!(NotificationStatus, Pending, Sent, Failed);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilitySettings {
    #[serde(default = "default_font_scale")]
    pub font_scale: f32,
    #[serde(default)]
    pub high_contrast: bool,
    #[serde(default = "default_true")]
    pub voice_enabled: bool,
}

fn default_font_scale() -> f32 {
    1.0
}
fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePreferences {
    pub preferred_language: Option<String>,
    pub accessibility_settings: Option<AccessibilitySettings>,
}
