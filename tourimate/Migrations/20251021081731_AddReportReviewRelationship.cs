using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddReportReviewRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Reviews_EntityId",
                table: "Reports");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("272cf15e-99c6-4104-b7f3-1a48e20d47bb"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("5e2c16c1-422b-4fa6-bfb4-c103b84d8856"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("767592c4-99a0-47f3-af5c-dff735d79f1f"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 17, 29, 637, DateTimeKind.Utc).AddTicks(9835), new DateTime(2025, 10, 21, 8, 17, 29, 637, DateTimeKind.Utc).AddTicks(9836) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 17, 29, 637, DateTimeKind.Utc).AddTicks(9844), new DateTime(2025, 10, 21, 8, 17, 29, 637, DateTimeKind.Utc).AddTicks(9844) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 17, 29, 637, DateTimeKind.Utc).AddTicks(9847), new DateTime(2025, 10, 21, 8, 17, 29, 637, DateTimeKind.Utc).AddTicks(9847) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("40982ff6-94b3-4365-b245-48ee32234201"), "Finance", new DateTime(2025, 10, 21, 8, 17, 29, 638, DateTimeKind.Utc).AddTicks(227), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 8, 17, 29, 638, DateTimeKind.Utc).AddTicks(228), "0.15" },
                    { new Guid("a3c2d40c-70c1-4833-8f37-fa0a4411c491"), "Security", new DateTime(2025, 10, 21, 8, 17, 29, 638, DateTimeKind.Utc).AddTicks(248), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 8, 17, 29, 638, DateTimeKind.Utc).AddTicks(248), "5" },
                    { new Guid("eb9651f0-e90b-4a6d-8639-0041216942e9"), "Finance", new DateTime(2025, 10, 21, 8, 17, 29, 638, DateTimeKind.Utc).AddTicks(223), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 8, 17, 29, 638, DateTimeKind.Utc).AddTicks(224), "0.15" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Reviews_EntityId",
                table: "Reports",
                column: "EntityId",
                principalTable: "Reviews",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Reviews_EntityId",
                table: "Reports");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("40982ff6-94b3-4365-b245-48ee32234201"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a3c2d40c-70c1-4833-8f37-fa0a4411c491"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("eb9651f0-e90b-4a6d-8639-0041216942e9"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8926), new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8927) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8931), new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8931) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8934), new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(8935) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("272cf15e-99c6-4104-b7f3-1a48e20d47bb"), "Finance", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9299), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9299), "0.15" },
                    { new Guid("5e2c16c1-422b-4fa6-bfb4-c103b84d8856"), "Finance", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9294), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9295), "0.15" },
                    { new Guid("767592c4-99a0-47f3-af5c-dff735d79f1f"), "Security", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9302), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 8, 0, 57, 942, DateTimeKind.Utc).AddTicks(9302), "5" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Reviews_EntityId",
                table: "Reports",
                column: "EntityId",
                principalTable: "Reviews",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
