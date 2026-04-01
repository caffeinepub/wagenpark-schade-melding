import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

import InviteLinks "invite-links/invite-links-module";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Random "mo:core/Random";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let inviteLinksState = InviteLinks.initState();

  module Vehicle {
    public func compareByNumber(vehicle1 : Vehicle, vehicle2 : Vehicle) : Order.Order {
      Text.compare(vehicle1.vehicleNumber, vehicle2.vehicleNumber);
    };
  };

  type DamageId = Nat;
  type VehicleId = Nat;
  type InspectionId = Nat;

  type DamageReportInput = {
    vehicleId : VehicleId;
    description : Text;
    damageType : Text;
    severity : Text;
    locationDescription : Text;
    photoIds : [Text];
  };

  type Vehicle = {
    vehicleNumber : Text;
    vehicleType : Text;
  };

  type DamageReport = {
    id : DamageId;
    vehicleId : VehicleId;
    description : Text;
    damageType : Text;
    severity : Text;
    locationDescription : Text;
    status : Text;
    reportDate : Time.Time;
    reportedBy : Principal;
    photoIds : [Text];
    lastUpdate : Time.Time;
  };

  type InspectionItem = {
    category : Text;
    subcategory : Text;
    description : Text;
    quantity : ?Nat;
    photoIds : [Text];
    stillPresent : Bool;
  };

  type InspectionRoundInput = {
    reporterName : Text;
    standplaats : Text;
    trekkerKenteken : Text;
    aanhangerKenteken : Text;
    items : [InspectionItem];
  };

  type InspectionRound = {
    id : InspectionId;
    reporterName : Text;
    standplaats : Text;
    trekkerKenteken : Text;
    aanhangerKenteken : Text;
    reportDate : Time.Time;
    reportedBy : Principal;
    items : [InspectionItem];
  };

  type CategoryStat = {
    category : Text;
    standplaats : Text;
    count : Nat;
    totalQuantity : Nat;
    month : Text;
  };

  module DamageReport {
    public func compareByReportDate(report1 : DamageReport, report2 : DamageReport) : Order.Order {
      if (report1.reportDate < report2.reportDate) #less else if (report1.reportDate > report2.reportDate) #greater else {
        Nat.compare(report1.id, report2.id);
      };
    };

    public func compareByLastUpdate(report1 : DamageReport, report2 : DamageReport) : Order.Order {
      Int.compare(report1.lastUpdate, report2.lastUpdate);
    };
  };

  let vehicles = Map.empty<VehicleId, Vehicle>();
  let damageReports = Map.empty<DamageId, DamageReport>();
  let inspectionRounds = Map.empty<InspectionId, InspectionRound>();

  var nextVehicleId = 1;
  var nextDamageId = 1;
  var nextInspectionId = 1;

  // Vehicle Management (Admin only)
  public shared ({ caller }) func addVehicle(vehicleNumber : Text, vehicleType : Text) : async VehicleId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can add vehicles");
    };
    let vehicle : Vehicle = { vehicleNumber; vehicleType };
    let vehicleId = nextVehicleId;
    vehicles.add(vehicleId, vehicle);
    nextVehicleId += 1;
    vehicleId;
  };

  public shared ({ caller }) func removeVehicle(vehicleId : VehicleId) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove vehicles");
    };
    switch (vehicles.get(vehicleId)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (_) { vehicles.remove(vehicleId) };
    };
  };

  public query ({ caller }) func getAllVehicles() : async [Vehicle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can view vehicles");
    };
    vehicles.values().toArray().sort(Vehicle.compareByNumber);
  };

  public query ({ caller }) func getVehicleById(vehicleId : VehicleId) : async Vehicle {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can view vehicles");
    };
    switch (vehicles.get(vehicleId)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (?vehicle) { vehicle };
    };
  };

  public query ({ caller }) func getAvailableVehicles(objectType : Text) : async [Vehicle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can view vehicles");
    };
    vehicles.values().toArray().filter(func(vehicle) { vehicle.vehicleType == objectType }).sort(Vehicle.compareByNumber);
  };

  // Damage Report Management
  public shared ({ caller }) func addDamageReport(reportInput : DamageReportInput) : async DamageId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can submit damage reports");
    };
    switch (vehicles.get(reportInput.vehicleId)) {
      case (null) { Runtime.trap("Vehicle not found") };
      case (_) {
        let damageReport : DamageReport = {
          id = nextDamageId;
          vehicleId = reportInput.vehicleId;
          description = reportInput.description;
          damageType = reportInput.damageType;
          severity = reportInput.severity;
          locationDescription = reportInput.locationDescription;
          status = "open";
          reportDate = Time.now();
          reportedBy = caller;
          photoIds = reportInput.photoIds;
          lastUpdate = Time.now();
        };
        damageReports.add(nextDamageId, damageReport);
        nextDamageId += 1;
        damageReport.id;
      };
    };
  };

  public shared ({ caller }) func updateDamageReportStatus(damageReportId : DamageId, newStatus : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update damage report status");
    };
    switch (damageReports.get(damageReportId)) {
      case (null) { Runtime.trap("Damage report not found") };
      case (?report) {
        let updatedReport : DamageReport = { report with status = newStatus; lastUpdate = Time.now() };
        damageReports.add(damageReportId, updatedReport);
      };
    };
  };

  public shared ({ caller }) func addPhotoToDamageReport(damageReportId : DamageId, photoId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can add photos to damage reports");
    };
    switch (damageReports.get(damageReportId)) {
      case (null) { Runtime.trap("Damage report not found") };
      case (?report) {
        if (report.reportedBy != caller) {
          Runtime.trap("Unauthorized: Only the author of a report may upload photos.");
        };
        let updatedPhotoIds = List.empty<Text>();
        updatedPhotoIds.addAll(report.photoIds.values());
        updatedPhotoIds.add(photoId);
        let updatedReport : DamageReport = { report with photoIds = updatedPhotoIds.toArray(); lastUpdate = Time.now() };
        damageReports.add(damageReportId, updatedReport);
      };
    };
  };

  public query ({ caller }) func getReportsForVehicle(vehicleId : VehicleId) : async [DamageReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can view damage reports");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      damageReports.values().filter(func(report) { report.vehicleId == vehicleId }).toArray();
    } else {
      damageReports.values().filter(func(report) { report.vehicleId == vehicleId and report.reportedBy == caller }).toArray();
    };
  };

  public query ({ caller }) func getReportsByStatus(status : Text) : async [DamageReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can view damage reports");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      damageReports.values().filter(func(report) { report.status == status }).toArray();
    } else {
      damageReports.values().filter(func(report) { report.status == status and report.reportedBy == caller }).toArray();
    };
  };

  public query ({ caller }) func getReportsByUser(userId : Principal) : async [DamageReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can view damage reports");
    };
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own reports");
    };
    damageReports.values().filter(func(report) { report.reportedBy == userId }).toArray().sort(DamageReport.compareByReportDate);
  };

  public query ({ caller }) func getOpenDamages() : async [DamageReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can view damage reports");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      damageReports.values().filter(func(report) { report.status == "open" }).toArray();
    } else {
      damageReports.values().filter(func(report) { report.status == "open" and report.reportedBy == caller }).toArray();
    };
  };

  public query ({ caller }) func getAllDamageReports() : async [DamageReport] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all damage reports");
    };
    damageReports.values().toArray().sort(DamageReport.compareByReportDate);
  };

  public query ({ caller }) func getAllDamagesForVehicle(vehicleId : VehicleId) : async [DamageReport] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all damages for a vehicle");
    };
    damageReports.values().filter(func(report) { report.vehicleId == vehicleId }).toArray();
  };

  // Inspection Rounds
  public shared ({ caller }) func addInspectionRound(input : InspectionRoundInput) : async InspectionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only employees can submit inspection rounds");
    };
    let round : InspectionRound = {
      id = nextInspectionId;
      reporterName = input.reporterName;
      standplaats = input.standplaats;
      trekkerKenteken = input.trekkerKenteken;
      aanhangerKenteken = input.aanhangerKenteken;
      reportDate = Time.now();
      reportedBy = caller;
      items = input.items;
    };
    inspectionRounds.add(nextInspectionId, round);
    nextInspectionId += 1;
    round.id;
  };

  public query ({ caller }) func getAllInspectionRounds() : async [InspectionRound] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all inspection rounds");
    };
    inspectionRounds.values().toArray();
  };

  public query ({ caller }) func getMyInspectionRounds() : async [InspectionRound] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    inspectionRounds.values().filter(func(r) { r.reportedBy == caller }).toArray();
  };

  public query ({ caller }) func getInspectionRoundsByStandplaats(standplaats : Text) : async [InspectionRound] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can filter inspection rounds");
    };
    inspectionRounds.values().filter(func(r) { r.standplaats == standplaats }).toArray();
  };

  public query ({ caller }) func getInspectionStats() : async [CategoryStat] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view inspection stats");
    };
    // Build stats: group by month + standplaats + category
    let statsMap = Map.empty<Text, CategoryStat>();
    for (round in inspectionRounds.values()) {
      let date = Time.now(); // use round.reportDate
      let _ = date; // suppress unused warning
      let roundDate = round.reportDate;
      let millis = roundDate / 1_000_000;
      // Simple month key: derive from timestamp
      // We'll use a text key: standplaats|category|month
      // month approximation: days since epoch / 30
      let daysSinceEpoch = Int.abs(millis) / 86400000;
      let monthIndex = daysSinceEpoch / 30;
      let monthKey = monthIndex.toText();
      for (item in round.items.values()) {
        let key = round.standplaats # "|" # item.category # "|" # monthKey;
        let qty = switch (item.quantity) { case (?q) q; case null 0 };
        switch (statsMap.get(key)) {
          case (null) {
            statsMap.add(key, {
              category = item.category;
              standplaats = round.standplaats;
              count = 1;
              totalQuantity = qty;
              month = monthKey;
            });
          };
          case (?existing) {
            statsMap.add(key, {
              category = existing.category;
              standplaats = existing.standplaats;
              count = existing.count + 1;
              totalQuantity = existing.totalQuantity + qty;
              month = existing.month;
            });
          };
        };
      };
    };
    statsMap.values().toArray();
  };

  // Invite Links
  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can generate invite codes");
    };
    let blob = await Random.blob();
    let code = InviteLinks.generateUUID(blob);
    InviteLinks.generateInviteCode(inviteLinksState, code);
    code;
  };

  public shared ({ caller }) func redeemInviteCode(code : Text) : async () {
    InviteLinks.submitRSVP(inviteLinksState, caller.toText(), true, code);
    accessControlState.userRoles.add(caller, #user);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinks.InviteCode] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view invite codes");
    };
    InviteLinks.getInviteCodes(inviteLinksState);
  };
};
