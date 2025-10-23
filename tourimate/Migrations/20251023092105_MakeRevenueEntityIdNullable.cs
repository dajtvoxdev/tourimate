using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class MakeRevenueEntityIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Products_EntityId",
                table: "Revenue");

            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Tours_EntityId",
                table: "Revenue");

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

            migrationBuilder.AlterColumn<Guid>(
                name: "EntityId",
                table: "Revenue",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3221), new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3221) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3238), new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3238) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3278), new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3279) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0ecfa6a2-b0be-4e67-a095-c6fa851b11b9"), "Finance", new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3656), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3657), "0.15" },
                    { new Guid("b974f33d-1403-47e2-93f3-1df3fc274327"), "Finance", new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3652), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3653), "0.15" },
                    { new Guid("e0b65b05-124e-4102-9b40-e5e2dd0948ff"), "Security", new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3680), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 23, 9, 21, 0, 674, DateTimeKind.Utc).AddTicks(3680), "5" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Revenue_Products_EntityId",
                table: "Revenue",
                column: "EntityId",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Revenue_Tours_EntityId",
                table: "Revenue",
                column: "EntityId",
                principalTable: "Tours",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Products_EntityId",
                table: "Revenue");

            migrationBuilder.DropForeignKey(
                name: "FK_Revenue_Tours_EntityId",
                table: "Revenue");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0ecfa6a2-b0be-4e67-a095-c6fa851b11b9"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("b974f33d-1403-47e2-93f3-1df3fc274327"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e0b65b05-124e-4102-9b40-e5e2dd0948ff"));

            migrationBuilder.AlterColumn<Guid>(
                name: "EntityId",
                table: "Revenue",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

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
                name: "FK_Revenue_Products_EntityId",
                table: "Revenue",
                column: "EntityId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Revenue_Tours_EntityId",
                table: "Revenue",
                column: "EntityId",
                principalTable: "Tours",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
