using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRevenueForeignKeys : Migration
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

            migrationBuilder.DropIndex(
                name: "IX_Revenue_EntityId",
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

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(799), new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(799) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(816), new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(817) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(820), new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(820) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0c5ed87a-823c-4bf4-a64f-f10dcefd26d9"), "Security", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1151), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1151), "5" },
                    { new Guid("ac580afe-32b6-4723-a587-47b2869fee7f"), "Finance", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1143), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1144), "0.15" },
                    { new Guid("c1b7d1a5-19fc-4580-a53b-8493484add65"), "Finance", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1147), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 23, 9, 24, 1, 57, DateTimeKind.Utc).AddTicks(1147), "0.15" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0c5ed87a-823c-4bf4-a64f-f10dcefd26d9"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("ac580afe-32b6-4723-a587-47b2869fee7f"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("c1b7d1a5-19fc-4580-a53b-8493484add65"));

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

            migrationBuilder.CreateIndex(
                name: "IX_Revenue_EntityId",
                table: "Revenue",
                column: "EntityId");

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
    }
}
