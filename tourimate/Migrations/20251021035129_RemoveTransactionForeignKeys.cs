using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTransactionForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Bookings_EntityId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Orders_EntityId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Promotions_EntityId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_EntityId",
                table: "Transactions");

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

            migrationBuilder.AddColumn<Guid>(
                name: "BookingId",
                table: "Transactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "Transactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PromotionId",
                table: "Transactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6124), new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6126) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6131), new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6131) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6135), new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6135) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0463eb90-89f0-43b6-9e53-7948ceb5a52d"), "Finance", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6415), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6415), "0.15" },
                    { new Guid("2feafca7-229c-4e27-bd93-b43da60693be"), "Finance", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6428), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6428), "0.15" },
                    { new Guid("d7d2489f-970f-4152-8fc6-7a529e695dfd"), "Security", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6431), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 21, 3, 51, 28, 784, DateTimeKind.Utc).AddTicks(6432), "5" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_BookingId",
                table: "Transactions",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_OrderId",
                table: "Transactions",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_PromotionId",
                table: "Transactions",
                column: "PromotionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Bookings_BookingId",
                table: "Transactions",
                column: "BookingId",
                principalTable: "Bookings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Orders_OrderId",
                table: "Transactions",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Promotions_PromotionId",
                table: "Transactions",
                column: "PromotionId",
                principalTable: "Promotions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Bookings_BookingId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Orders_OrderId",
                table: "Transactions");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Promotions_PromotionId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_BookingId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_OrderId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_PromotionId",
                table: "Transactions");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0463eb90-89f0-43b6-9e53-7948ceb5a52d"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("2feafca7-229c-4e27-bd93-b43da60693be"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("d7d2489f-970f-4152-8fc6-7a529e695dfd"));

            migrationBuilder.DropColumn(
                name: "BookingId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "PromotionId",
                table: "Transactions");

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
                name: "IX_Transactions_EntityId",
                table: "Transactions",
                column: "EntityId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Bookings_EntityId",
                table: "Transactions",
                column: "EntityId",
                principalTable: "Bookings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Orders_EntityId",
                table: "Transactions",
                column: "EntityId",
                principalTable: "Orders",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Promotions_EntityId",
                table: "Transactions",
                column: "EntityId",
                principalTable: "Promotions",
                principalColumn: "Id");
        }
    }
}
