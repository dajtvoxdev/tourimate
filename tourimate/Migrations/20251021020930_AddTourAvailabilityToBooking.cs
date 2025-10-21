using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddTourAvailabilityToBooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("214c7489-24f3-4b72-97c7-5effd7286d15"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("7f5cb398-f4c0-4d8a-99eb-74985aa0a4bd"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("925a5c02-17b9-4535-9faf-01777f74a7e7"));

            migrationBuilder.RenameColumn(
                name: "Participants",
                table: "Bookings",
                newName: "ChildCount");

            migrationBuilder.AddColumn<int>(
                name: "AdultCount",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "TourAvailabilityId",
                table: "Bookings",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 2, 9, 29, 230, DateTimeKind.Utc).AddTicks(9704), new DateTime(2025, 10, 21, 2, 9, 29, 230, DateTimeKind.Utc).AddTicks(9704) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 2, 9, 29, 230, DateTimeKind.Utc).AddTicks(9710), new DateTime(2025, 10, 21, 2, 9, 29, 230, DateTimeKind.Utc).AddTicks(9711) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 2, 9, 29, 230, DateTimeKind.Utc).AddTicks(9714), new DateTime(2025, 10, 21, 2, 9, 29, 230, DateTimeKind.Utc).AddTicks(9715) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("076675ab-ed80-49db-bec7-12e9dab6f07c"), "Finance", new DateTime(2025, 10, 21, 2, 9, 29, 231, DateTimeKind.Utc).AddTicks(3), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 2, 9, 29, 231, DateTimeKind.Utc).AddTicks(4), "0.15" },
                    { new Guid("54fbe6e6-d65d-4ce8-b8cc-186565a3956c"), "Finance", new DateTime(2025, 10, 21, 2, 9, 29, 231, DateTimeKind.Utc).AddTicks(18), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 2, 9, 29, 231, DateTimeKind.Utc).AddTicks(18), "0.15" },
                    { new Guid("e96cbe65-5058-4e56-ba15-d36f3c7e0eca"), "Security", new DateTime(2025, 10, 21, 2, 9, 29, 231, DateTimeKind.Utc).AddTicks(22), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 2, 9, 29, 231, DateTimeKind.Utc).AddTicks(22), "5" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TourAvailabilityId",
                table: "Bookings",
                column: "TourAvailabilityId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_TourAvailability_TourAvailabilityId",
                table: "Bookings",
                column: "TourAvailabilityId",
                principalTable: "TourAvailability",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_TourAvailability_TourAvailabilityId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_TourAvailabilityId",
                table: "Bookings");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("076675ab-ed80-49db-bec7-12e9dab6f07c"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("54fbe6e6-d65d-4ce8-b8cc-186565a3956c"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e96cbe65-5058-4e56-ba15-d36f3c7e0eca"));

            migrationBuilder.DropColumn(
                name: "AdultCount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "TourAvailabilityId",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "ChildCount",
                table: "Bookings",
                newName: "Participants");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2791), new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2791) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2796), new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2797) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2800), new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2801) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("214c7489-24f3-4b72-97c7-5effd7286d15"), "Finance", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3021), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3021), "0.15" },
                    { new Guid("7f5cb398-f4c0-4d8a-99eb-74985aa0a4bd"), "Finance", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3017), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3018), "0.15" },
                    { new Guid("925a5c02-17b9-4535-9faf-01777f74a7e7"), "Security", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3024), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3025), "5" }
                });
        }
    }
}
