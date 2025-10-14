using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTourAvailabilityModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("35c081f8-2c55-474b-a4e6-2cab62f8b077"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("cbbf21c0-f3f7-4b3c-8d91-a9d0846f5b93"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e1a11a54-41b6-432c-85cc-fbd3c5086273"));

            migrationBuilder.DropColumn(
                name: "MaxParticipants",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "TimeSlots",
                table: "TourAvailability");

            migrationBuilder.RenameColumn(
                name: "Price",
                table: "Tours",
                newName: "BasePrice");

            migrationBuilder.RenameIndex(
                name: "IX_Tours_Price_IsActive",
                table: "Tours",
                newName: "IX_Tours_BasePrice_IsActive");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Date",
                table: "TourAvailability",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AddColumn<decimal>(
                name: "AdultPrice",
                table: "TourAvailability",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ChildPrice",
                table: "TourAvailability",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "DepartureDivisionCode",
                table: "TourAvailability",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "TourAvailability",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Surcharge",
                table: "TourAvailability",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TripTime",
                table: "TourAvailability",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Vehicle",
                table: "TourAvailability",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4398), new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4399) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4403), new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4404) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4407), new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4408) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("719368e0-e3a0-4906-99ff-0e5abda04a3e"), "Security", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4659), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4660), "5" },
                    { new Guid("a3146cb8-de51-4642-9f6b-4d297f8fa430"), "Finance", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4641), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4641), "0.15" },
                    { new Guid("e2307045-84c4-437f-b516-944e17628153"), "Finance", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4645), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4645), "0.15" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourAvailability_DepartureDivisionCode",
                table: "TourAvailability",
                column: "DepartureDivisionCode");

            migrationBuilder.AddForeignKey(
                name: "FK_TourAvailability_Divisions_DepartureDivisionCode",
                table: "TourAvailability",
                column: "DepartureDivisionCode",
                principalTable: "Divisions",
                principalColumn: "Code");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourAvailability_Divisions_DepartureDivisionCode",
                table: "TourAvailability");

            migrationBuilder.DropIndex(
                name: "IX_TourAvailability_DepartureDivisionCode",
                table: "TourAvailability");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("719368e0-e3a0-4906-99ff-0e5abda04a3e"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a3146cb8-de51-4642-9f6b-4d297f8fa430"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e2307045-84c4-437f-b516-944e17628153"));

            migrationBuilder.DropColumn(
                name: "AdultPrice",
                table: "TourAvailability");

            migrationBuilder.DropColumn(
                name: "ChildPrice",
                table: "TourAvailability");

            migrationBuilder.DropColumn(
                name: "DepartureDivisionCode",
                table: "TourAvailability");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "TourAvailability");

            migrationBuilder.DropColumn(
                name: "Surcharge",
                table: "TourAvailability");

            migrationBuilder.DropColumn(
                name: "TripTime",
                table: "TourAvailability");

            migrationBuilder.DropColumn(
                name: "Vehicle",
                table: "TourAvailability");

            migrationBuilder.RenameColumn(
                name: "BasePrice",
                table: "Tours",
                newName: "Price");

            migrationBuilder.RenameIndex(
                name: "IX_Tours_BasePrice_IsActive",
                table: "Tours",
                newName: "IX_Tours_Price_IsActive");

            migrationBuilder.AddColumn<int>(
                name: "MaxParticipants",
                table: "Tours",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "Date",
                table: "TourAvailability",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<string>(
                name: "TimeSlots",
                table: "TourAvailability",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(314), new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(317) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(323), new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(324) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(330), new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(330) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("35c081f8-2c55-474b-a4e6-2cab62f8b077"), "Finance", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(805), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(806), "0.15" },
                    { new Guid("cbbf21c0-f3f7-4b3c-8d91-a9d0846f5b93"), "Finance", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(845), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(845), "0.15" },
                    { new Guid("e1a11a54-41b6-432c-85cc-fbd3c5086273"), "Security", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(848), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 14, 2, 28, 51, 981, DateTimeKind.Utc).AddTicks(848), "5" }
                });
        }
    }
}
