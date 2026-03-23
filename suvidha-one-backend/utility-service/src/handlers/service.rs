use crate::AppState;
use axum::{extract::State, response::IntoResponse};
use serde::Serialize;
use shared::response::ok;

#[derive(Debug, Serialize)]
pub struct ServiceInfo {
    pub id: String,
    pub name: String,
    pub department: String,
    pub description: String,
    pub icon: String,
}

pub async fn list_services(
    State(_state): State<AppState>,
) -> impl IntoResponse {
    let services = vec![
        ServiceInfo { id: "electricity".to_string(), name: "Electricity Bill".to_string(), department: "DISCOM".to_string(), description: "Pay electricity bills".to_string(), icon: "bolt".to_string() },
        ServiceInfo { id: "water".to_string(), name: "Water Bill".to_string(), department: "Municipal".to_string(), description: "Pay water bills".to_string(), icon: "droplet".to_string() },
        ServiceInfo { id: "gas".to_string(), name: "Gas Bill".to_string(), department: "PNGRB".to_string(), description: "Pay gas bills".to_string(), icon: "flame".to_string() },
        ServiceInfo { id: "property_tax".to_string(), name: "Property Tax".to_string(), department: "Municipal".to_string(), description: "Pay property tax".to_string(), icon: "home".to_string() },
    ];
    ok(services)
}
