using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSePayTransactionForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SePayTransactions_Bookings_EntityId",
                table: "SePayTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_SePayTransactions_Orders_EntityId",
                table: "SePayTransactions");

            migrationBuilder.DropIndex(
                name: "IX_SePayTransactions_EntityId",
                table: "SePayTransactions");

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

            migrationBuilder.AddColumn<Guid>(
                name: "BookingId",
                table: "SePayTransactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "SePayTransactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(8), new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(9) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(14), new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(15) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(18), new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(19) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("37b1fd17-b3bb-40d6-8cf6-c00bcca03063"), "Finance", new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(410), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(411), "0.15" },
                    { new Guid("38457224-bf85-4862-96fd-20401a0ffccd"), "Security", new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(432), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(432), "5" },
                    { new Guid("a6b898fd-394d-442c-9a7b-78f45f3960d7"), "Finance", new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(428), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 3, 45, 3, 417, DateTimeKind.Utc).AddTicks(429), "0.15" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SePayTransactions_BookingId",
                table: "SePayTransactions",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_SePayTransactions_OrderId",
                table: "SePayTransactions",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_SePayTransactions_Bookings_BookingId",
                table: "SePayTransactions",
                column: "BookingId",
                principalTable: "Bookings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SePayTransactions_Orders_OrderId",
                table: "SePayTransactions",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SePayTransactions_Bookings_BookingId",
                table: "SePayTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_SePayTransactions_Orders_OrderId",
                table: "SePayTransactions");

            migrationBuilder.DropIndex(
                name: "IX_SePayTransactions_BookingId",
                table: "SePayTransactions");

            migrationBuilder.DropIndex(
                name: "IX_SePayTransactions_OrderId",
                table: "SePayTransactions");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("37b1fd17-b3bb-40d6-8cf6-c00bcca03063"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("38457224-bf85-4862-96fd-20401a0ffccd"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a6b898fd-394d-442c-9a7b-78f45f3960d7"));

            migrationBuilder.DropColumn(
                name: "BookingId",
                table: "SePayTransactions");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "SePayTransactions");

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
                name: "IX_SePayTransactions_EntityId",
                table: "SePayTransactions",
                column: "EntityId");

            migrationBuilder.AddForeignKey(
                name: "FK_SePayTransactions_Bookings_EntityId",
                table: "SePayTransactions",
                column: "EntityId",
                principalTable: "Bookings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SePayTransactions_Orders_EntityId",
                table: "SePayTransactions",
                column: "EntityId",
                principalTable: "Orders",
                principalColumn: "Id");
        }
    }
}
